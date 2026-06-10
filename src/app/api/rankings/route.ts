import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase-admin';
import { TOPIC_CATEGORIES, normalizeCategory } from '@/lib/topicCategories';

// GET Route Handler はデフォルト非キャッシュ。getServerSession と Firestore 取得を
// 行うため毎回 request-time に実行される（force-dynamic / unstable_cache は不要）。

// この件数未満のジャンルは、相談者の特定を防ぐため中身(examples)を返さない（k-匿名性）。
const MIN_VISIBLE = 3;
const MAX_EXAMPLES = 10;
// 似た要約をひとつにまとめる類似度のしきい値（文字bigramのDice係数）。
// 実データでは同型相談の言い回し違いが約0.68、別内容の相談同士は約0.33だったため、
// その中間の 0.6 を採用。
const SIMILARITY_THRESHOLD = 0.6;

function bigrams(text: string): Set<string> {
  const norm = text.replace(/[\s。、．，・！？!?「」『』（）()]/g, '');
  const grams = new Set<string>();
  for (let i = 0; i < norm.length - 1; i++) grams.add(norm.slice(i, i + 2));
  if (grams.size === 0 && norm) grams.add(norm);
  return grams;
}

function diceSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const g of a) if (b.has(g)) shared++;
  return (2 * shared) / (a.size + b.size);
}

type SummaryEntry = { id: string; text: string };
type ExampleGroup = { id: string; text: string; count: number; grams: Set<string> };

// 類似する要約を貪欲法でまとめる。各グループは代表1件（最初に現れた要約とそのdocId）を持つ。
function groupSimilar(entries: SummaryEntry[]): ExampleGroup[] {
  const groups: ExampleGroup[] = [];
  for (const e of entries) {
    const grams = bigrams(e.text);
    const hit = groups.find((g) => diceSimilarity(g.grams, grams) >= SIMILARITY_THRESHOLD);
    if (hit) {
      hit.count++;
    } else {
      groups.push({ id: e.id, text: e.text, count: 1, grams });
    }
  }
  return groups.sort((a, b) => b.count - a.count);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await db.collection('analyses').get();

    const counts: Record<string, number> = {};
    const entries: Record<string, SummaryEntry[]> = {};
    for (const cat of TOPIC_CATEGORIES) {
      counts[cat.id] = 0;
      entries[cat.id] = [];
    }

    let totalCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      // プライバシー: 生の入力文 data.input には触れない。category と summary のみ参照。
      const category = normalizeCategory(data.category);
      counts[category] = (counts[category] ?? 0) + 1;
      totalCount++;
      const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
      if (summary) entries[category].push({ id: doc.id, text: summary });
    }

    const ranked = TOPIC_CATEGORIES.map((cat) => {
      const count = counts[cat.id] ?? 0;
      return {
        id: cat.id,
        label: cat.label,
        icon: cat.icon,
        count,
        examples:
          count >= MIN_VISIBLE
            ? groupSimilar(entries[cat.id])
                .slice(0, MAX_EXAMPLES)
                .map(({ id, text, count: n }) => ({ id, text, count: n }))
            : [],
      };
    })
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ja'));

    let lastCount = -1;
    let lastRank = 0;
    const topics = ranked.map((t, i) => {
      const rank = t.count === lastCount ? lastRank : i + 1;
      lastCount = t.count;
      lastRank = rank;
      return { ...t, rank };
    });

    return NextResponse.json({
      topics,
      totalCount,
      minVisible: MIN_VISIBLE,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Rankings API error:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal Server Error', details },
      { status: 500 },
    );
  }
}
