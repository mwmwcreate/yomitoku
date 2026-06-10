import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase-admin';
import { TOPIC_CATEGORIES, normalizeCategory } from '@/lib/topicCategories';

// GET Route Handler はデフォルト非キャッシュ。getServerSession と Firestore 取得を
// 行うため毎回 request-time に実行される（force-dynamic / unstable_cache は不要）。

// この件数未満のジャンルは、相談者の特定を防ぐため中身(summaries)を返さない（k-匿名性）。
const MIN_VISIBLE = 3;
const MAX_SUMMARIES = 20;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await db.collection('analyses').get();

    const counts: Record<string, number> = {};
    const summaries: Record<string, string[]> = {};
    for (const cat of TOPIC_CATEGORIES) {
      counts[cat.id] = 0;
      summaries[cat.id] = [];
    }

    let totalCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      // プライバシー: 生の入力文 data.input には触れない。category と summary のみ参照。
      const category = normalizeCategory(data.category);
      counts[category] = (counts[category] ?? 0) + 1;
      totalCount++;
      const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
      if (summary) summaries[category].push(summary);
    }

    const ranked = TOPIC_CATEGORIES.map((cat) => {
      const count = counts[cat.id] ?? 0;
      return {
        id: cat.id,
        label: cat.label,
        icon: cat.icon,
        count,
        summaries:
          count >= MIN_VISIBLE ? summaries[cat.id].slice(0, MAX_SUMMARIES) : [],
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
