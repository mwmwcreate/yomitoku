// 相談テーマ・ランキングのジャンル定義（単一の真実源）。
// analyze ルート / rankings API / backfill スクリプトはこの定義を共有する。

export type TopicCategory = {
  id: string;
  label: string;
  icon: string;
};

export const TOPIC_CATEGORIES: TopicCategory[] = [
  { id: "work", label: "仕事・職場", icon: "💼" },
  { id: "housing", label: "住まい・ご近所", icon: "🏠" },
  { id: "consumer", label: "買い物・消費者", icon: "🛒" },
  { id: "money", label: "お金・契約", icon: "💰" },
  { id: "ip", label: "著作権・知的財産", icon: "©️" },
  { id: "net", label: "ネット・SNS", icon: "📱" },
  { id: "privacy", label: "個人情報", icon: "🔒" },
  { id: "family", label: "家族・離婚・相続", icon: "👨‍👩‍👧" },
  { id: "crime", label: "犯罪・刑事", icon: "⚖️" },
  { id: "traffic", label: "交通・乗り物", icon: "🚗" },
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
  .map((c) => `  - ${c.id}: ${c.label}`)
  .join("\n");

export const CATEGORY_INSTRUCTION = `
【ジャンル判定(category)について】
- 以下の固定ジャンルから、相談内容に最も合うものを1つだけ選び、その id(英字)を "category" に入れてください:
${CATEGORY_LIST_TEXT}
- 判断は「関係する法律名」ではなく「相談者の困りごとのテーマ」で行ってください。例えば民法が関係していても、敷金や近隣の話なら housing、お金の貸し借りなら money、ネット上の話なら net を選びます。
- どのジャンルにも明確に当てはまらない場合のみ "category" を "other" にしてください。その場合に限り、本来ふさわしいと思う短いジャンル名(日本語)を "categorySuggestion" に入れてください。"other" 以外を選んだときは "categorySuggestion" は空文字 "" にしてください。

【相談の要約(summary)について】
- この相談を1文(40〜60字程度)で要約し "summary" に入れてください。後で他の利用者に「どんな相談が多いか」を匿名で示すために使います。
- 個人が特定されうる情報は必ず除外してください: 人名・会社名・店名などの固有名詞、具体的な金額・日付・電話番号・住所。
- 「〜について知りたい」「〜で困っている」のように中立的で抽象的に書き、断定や法的助言はしないでください。
`;
