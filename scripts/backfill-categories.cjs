// 既存 analyses に AI 分類で category と summary を後付け/再付与するスクリプト。
//   ... --force         (全件 dry-run・再分類)
//   ... --write --force (全件 再分類して書き込み)

const admin = require('firebase-admin');
const { OpenAI } = require('openai');

const TOPIC_CATEGORIES = [
  { id: 'work', label: '仕事・職場', example: '残業代・解雇・給料未払い・パワハラ・退職' },
  { id: 'housing', label: '住まい・ご近所', example: '賃貸・敷金・近隣トラブル・騒音・不動産' },
  { id: 'consumer', label: '買い物・消費者', example: '通販トラブル・返品・悪質商法・不要な物を買わされた・契約解除' },
  { id: 'money', label: 'お金・契約', example: '貸し借り・借金・利息・金銭トラブル' },
  { id: 'ip', label: '著作権・知的財産', example: '著作権・商標・無断転載・パクリ' },
  { id: 'net', label: 'ネット・SNS', example: 'SNS中傷・ネット投稿・なりすまし' },
  { id: 'privacy', label: '個人情報', example: '個人情報の漏洩・無断利用・プライバシー侵害' },
  { id: 'family', label: '家族・離婚・相続', example: '離婚・相続・親権・養育費' },
  { id: 'crime', label: '犯罪・刑事', example: '詐欺・暴行・窃盗・脅迫・刑事事件' },
  { id: 'traffic', label: '交通・乗り物', example: '交通事故・駐車場・車・運転' },
  { id: 'other', label: 'その他' },
];
const CATEGORY_IDS = TOPIC_CATEGORIES.map((c) => c.id);
const CATEGORY_LIST_TEXT = TOPIC_CATEGORIES.filter((c) => c.id !== 'other')
  .map((c) => `  - ${c.id}: ${c.label}（例: ${c.example}）`)
  .join('\n');

function normalizeCategory(raw) {
  const v = typeof raw === 'string' ? raw.trim() : '';
  return CATEGORY_IDS.includes(v) ? v : 'other';
}

const WRITE = process.argv.includes('--write');
const FORCE = process.argv.includes('--force');

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

(1) 次の固定ジャンルから最も合うものを必ず1つ選び、その id(英字)を "category" に入れる。各ジャンルの例も参考に:
${CATEGORY_LIST_TEXT}
- 判断は法律名ではなく「相談者の困りごとのテーマ」で行う。
- 重要: 上のジャンルのどれかに当てはまるなら必ずその id を選び "other" にしない。消費者トラブルは consumer、労働の悩みは work、賃貸や近隣は housing、交通事故は traffic、お金の貸し借りは money。
- 本当にどれにも当てはまらない場合だけ "other" にし、そのとき短いジャンル名(日本語)を "categorySuggestion" に入れる。それ以外は空文字。

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
  try { parsed = JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : {}; }
  const category = normalizeCategory(parsed.category);
  const categorySuggestion =
    category === 'other' && typeof parsed.categorySuggestion === 'string'
      ? parsed.categorySuggestion.trim().slice(0, 50) : '';
  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim().slice(0, 120) : '';
  return { category, categorySuggestion, summary };
}

(async () => {
  console.log((WRITE ? '*** WRITE ***' : '--- dry-run ---') + (FORCE ? ' [FORCE]' : ''));
  const snap = await db.collection('analyses').get();
  const counts = {};
  let processed = 0, skipped = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const hasCategory = typeof data.category === 'string' && data.category;
    const hasSummary = typeof data.summary === 'string' && data.summary.trim();
    if (!FORCE && hasCategory && hasSummary) { skipped++; continue; }
    const situation = typeof data.input === 'string' ? data.input : '';
    if (!situation) { skipped++; continue; }
    const { category, categorySuggestion, summary } = await classify(situation);
    counts[category] = (counts[category] || 0) + 1;
    processed++;
    console.log(`[${category}]${categorySuggestion ? ` (提案: ${categorySuggestion})` : ''}  ${summary}`);
    if (WRITE) await doc.ref.update({ category, categorySuggestion, summary });
  }
  console.log(`\n処理: ${processed}件 / スキップ: ${skipped}件`);
  console.log('内訳:', JSON.stringify(counts));
  if (!WRITE) console.log('\n→ 反映するには --write を付けて再実行してください。');
  process.exit(0);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
