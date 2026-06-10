// 既存 analyses に AI 分類で category と summary(匿名化要約) を後付けする一度きりのスクリプト。
//   node --env-file=.env.local scripts/backfill-categories.cjs          (dry-run)
//   node --env-file=.env.local scripts/backfill-categories.cjs --write  (Firestore に書き込み)
// category を既に持つドキュメントはスキップ（冪等）。

const admin = require('firebase-admin');
const { OpenAI } = require('openai');

// src/lib/topicCategories.ts と同期して保つこと（.ts を .cjs から import できないため複製）。
const TOPIC_CATEGORIES = [
  { id: 'work', label: '仕事・職場' },
  { id: 'housing', label: '住まい・ご近所' },
  { id: 'consumer', label: '買い物・消費者' },
  { id: 'money', label: 'お金・契約' },
  { id: 'ip', label: '著作権・知的財産' },
  { id: 'net', label: 'ネット・SNS' },
  { id: 'privacy', label: '個人情報' },
  { id: 'family', label: '家族・離婚・相続' },
  { id: 'crime', label: '犯罪・刑事' },
  { id: 'traffic', label: '交通・乗り物' },
  { id: 'other', label: 'その他' },
];
const CATEGORY_IDS = TOPIC_CATEGORIES.map((c) => c.id);
const CATEGORY_LIST_TEXT = TOPIC_CATEGORIES.filter((c) => c.id !== 'other')
  .map((c) => `  - ${c.id}: ${c.label}`)
  .join('\n');

function normalizeCategory(raw) {
  const v = typeof raw === 'string' ? raw.trim() : '';
  return CATEGORY_IDS.includes(v) ? v : 'other';
}

const WRITE = process.argv.includes('--write');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INSTRUCTIONS = `あなたは法律相談の分類器です。相談内容について次の2つを行ってください。

(1) 次の固定ジャンルから最も合うものを1つだけ選び、その id(英字)を "category" に入れる:
${CATEGORY_LIST_TEXT}
- 判断は「関係する法律名」ではなく「相談者の困りごとのテーマ」で行う（例: 民法でも、敷金や近隣なら housing、貸し借りなら money）。
- どのジャンルにも当てはまらない場合のみ "other" にし、そのときだけ短いジャンル名(日本語)を "categorySuggestion" に入れる。それ以外は空文字。

(2) この相談を1文(40〜60字程度)で要約し "summary" に入れる:
- 人名・会社名・店名などの固有名詞、具体的な金額・日付・住所は必ず除外する。
- 「〜について知りたい」のように中立的で抽象的に書く。

出力は {"category":"...","categorySuggestion":"...","summary":"..."} の JSON のみ。`;

async function classify(situation) {
  const res = await openai.responses.create({
    model: 'gpt-5.4-nano',
    instructions: INSTRUCTIONS,
    input: `相談: ${situation}`,
    temperature: 0,
  });
  const text = res.output_text || '';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : {};
  }
  const category = normalizeCategory(parsed.category);
  const categorySuggestion =
    category === 'other' && typeof parsed.categorySuggestion === 'string'
      ? parsed.categorySuggestion.trim().slice(0, 50)
      : '';
  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim().slice(0, 120) : '';
  return { category, categorySuggestion, summary };
}

(async () => {
  console.log(WRITE ? '*** WRITE モード ***' : '--- dry-run（表示のみ）---');
  const snap = await db.collection('analyses').get();
  const counts = {};
  let processed = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (typeof data.category === 'string' && data.category) { skipped++; continue; }
    const situation = typeof data.input === 'string' ? data.input : '';
    if (!situation) { skipped++; continue; }

    const { category, categorySuggestion, summary } = await classify(situation);
    counts[category] = (counts[category] || 0) + 1;
    processed++;
    console.log(`[${category}]${categorySuggestion ? ` (提案: ${categorySuggestion})` : ''}  ${summary}`);

    if (WRITE) {
      await doc.ref.update({ category, categorySuggestion, summary });
    }
  }

  console.log(`\n処理: ${processed}件 / スキップ: ${skipped}件`);
  console.log('内訳:', JSON.stringify(counts));
  if (!WRITE) console.log('\n→ 問題なければ --write を付けて再実行で Firestore に反映されます。');
  process.exit(0);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
