// 相談テーマ・ランキングのジャンル定義（単一の真実源）。
// analyze ルート / rankings API / backfill スクリプトはこの定義を共有する。

export type TopicCategory = {
  id: string;
  label: string;
  icon: string;
  example?: string; // 分類プロンプトでAIに渡す具体例（UI表示には使わない）
};

export const TOPIC_CATEGORIES: TopicCategory[] = [
  { id: "work", label: "仕事・職場", icon: "💼", example: "残業代・解雇・給料未払い・パワハラ・退職" },
  { id: "housing", label: "住まい・ご近所", icon: "🏠", example: "賃貸・敷金・近隣トラブル・騒音・不動産" },
  { id: "consumer", label: "買い物・消費者", icon: "🛒", example: "通販トラブル・返品・悪質商法・不要な物を買わされた・契約解除" },
  { id: "money", label: "お金・契約", icon: "💰", example: "貸し借り・借金・利息・金銭トラブル" },
  { id: "ip", label: "著作権・知的財産", icon: "©️", example: "著作権・商標・無断転載・パクリ" },
  { id: "net", label: "ネット・SNS", icon: "📱", example: "SNS中傷・ネット投稿・なりすまし" },
  { id: "privacy", label: "個人情報", icon: "🔒", example: "個人情報の漏洩・無断利用・プライバシー侵害" },
  { id: "family", label: "家族・離婚・相続", icon: "👨‍👩‍👧", example: "離婚・相続・親権・養育費" },
  { id: "crime", label: "犯罪・刑事", icon: "⚖️", example: "詐欺・暴行・窃盗・脅迫・刑事事件" },
  { id: "traffic", label: "交通・乗り物", icon: "🚗", example: "交通事故・駐車場・車・運転" },
  { id: "other", label: "その他", icon: "📋" },
];

export const CATEGORY_IDS: string[] = TOPIC_CATEGORIES.map((c) => c.id);

export function getCategory(id: string): TopicCategory {
  return (
    TOPIC_CATEGORIES.find((c) => c.id === id) ??
    TOPIC_CATEGORIES.find((c) => c.id === "other")!
  );
}

export function normalizeCategory(raw: unknown): string {
  const v = typeof raw === "string" ? raw.trim() : "";
  return CATEGORY_IDS.includes(v) ? v : "other";
}

const CATEGORY_LIST_TEXT = TOPIC_CATEGORIES.filter((c) => c.id !== "other")
  .map((c) => `  - ${c.id}: ${c.label}（例: ${c.example}）`)
  .join("\n");

export const CATEGORY_INSTRUCTION = `
【ジャンル判定(category)について】
- 次の固定ジャンルから、相談内容に最も合うものを必ず1つ選び、その id(英字)を "category" に入れてください。各ジャンルの例も参考に:
${CATEGORY_LIST_TEXT}
- 判断は「関係する法律名」ではなく「相談者の困りごとのテーマ」で行ってください。
- **重要**: 上のジャンルのどれかに当てはまるなら、必ずその id を選び "other" にしないこと。例えば消費者トラブルは consumer、労働の悩みは work、賃貸や近隣は housing、交通事故は traffic、お金の貸し借りは money です。
- 本当にどれにも当てはまらない場合だけ "category" を "other" にし、そのとき短いジャンル名(日本語)を "categorySuggestion" に入れてください。"other" 以外を選んだときは "categorySuggestion" は空文字 "" にしてください。

【相談の要約(summary)について】
- この相談を1文(40〜60字程度)で要約し "summary" に入れてください。
- 個人が特定されうる情報は必ず除外: 人名・会社名・店名などの固有名詞、具体的な金額・日付・電話番号・住所。
- 「〜について知りたい」のように中立的で抽象的に書き、断定や法的助言はしないでください。
`;
