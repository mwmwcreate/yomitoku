// 「規約・契約から調べる」モードで選べる文書タイプ。
// エンジン（API）は文書タイプに依存しないので、ここは主に
// (1) 質問チップ (2) プロンプトへの軽いヒント (3) 確認先の例 を切り替えるためのデータ。

export type DocumentType = {
  id: string;
  label: string;
  // プロンプトに渡す軽いヒント（最終的にはAIは実際の文書内容を優先する）
  hint: string;
  // 「最終確認はこちらへ」の既定の相手
  checkWith: string;
  // 入力欄プレースホルダ用
  placeholder: string;
  // よくある質問チップ
  starters: string[];
};

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: "rent",
    label: "住まい・賃貸",
    hint: "賃貸借契約書や管理規約",
    checkWith: "管理会社・貸主・不動産会社",
    placeholder: "賃貸借契約書や管理規約の本文をここに貼り付けてください。（該当しそうな章だけでもOK）",
    starters: [
      "ペットは飼える？",
      "途中で解約したら違約金はかかる？",
      "退去時の原状回復はどこまで自分の負担？",
      "更新料はいくら／いつ払う？",
      "又貸し（転貸）はしてもいい？",
    ],
  },
  {
    id: "work",
    label: "バイト・仕事",
    hint: "就業規則や雇用契約書",
    checkWith: "勤務先の人事・労務担当",
    placeholder: "就業規則や雇用契約書の本文をここに貼り付けてください。（該当しそうな章だけでもOK）",
    starters: [
      "辞めるときは何日前に言えばいい？",
      "残業代はどう計算される？",
      "有給休暇は取れる？",
      "シフトを断ることはできる？",
      "副業・かけ持ちは禁止されてる？",
    ],
  },
  {
    id: "subscription",
    label: "サブスク・アプリ",
    hint: "サービスの利用規約",
    checkWith: "サービスの運営・カスタマーサポート",
    placeholder: "アプリやサービスの利用規約の本文をここに貼り付けてください。（該当しそうな章だけでもOK）",
    starters: [
      "解約の方法と締め日は？",
      "自動更新の条件は？",
      "どんなときにアカウントが停止される？",
      "返金はできる？",
      "投稿したコンテンツの権利はどうなる？",
    ],
  },
  {
    id: "school",
    label: "学校",
    hint: "校則・学則・奨学金などの規定",
    checkWith: "学校の事務局・担当窓口",
    placeholder: "校則・学則・奨学金規定などの本文をここに貼り付けてください。（該当しそうな部分だけでもOK）",
    starters: [
      "アルバイトは許可されてる？",
      "欠席が何回で進級に影響する？",
      "奨学金の返還が免除される条件は？",
      "SNSの利用について決まりはある？",
    ],
  },
  {
    id: "insurance",
    label: "保険・その他契約",
    hint: "保険約款や各種契約書",
    checkWith: "契約先（保険会社・事業者）",
    placeholder: "保険約款や契約書の本文をここに貼り付けてください。（該当しそうな条項だけでもOK）",
    starters: [
      "どんなときに保険金が支払われる？",
      "保険金が支払われないのはどんな場合？",
      "解約の手続きと返戻金は？",
      "契約者ができる変更手続きは？",
    ],
  },
  {
    id: "other",
    label: "その他の文書",
    hint: "",
    checkWith: "文書の発行元・契約相手",
    placeholder: "規約・契約・ルールなどの文書の本文をここに貼り付けてください。",
    starters: [
      "この文書で禁止されていることは？",
      "私の義務はどう書かれてる？",
      "違反するとどうなると書かれてる？",
      "解約・退会の方法は？",
    ],
  },
];

export function getDocumentType(id: unknown): DocumentType {
  const found = typeof id === "string" ? DOCUMENT_TYPES.find((t) => t.id === id) : undefined;
  return found ?? DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1]; // 既定は「その他」
}
