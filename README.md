# yomitoku（よみとく）

**難しい法律も規約も、自分の状況に合わせてかみ砕く相談相手。**

yomitoku は、難しい法律や契約・規約を、自分の状況に合わせてやさしく読み解く Web アプリです。「これって大丈夫？」という日常の疑問や、読むのが大変な契約書・利用規約に対して、AI が関係する法律や該当条項を **「根拠」とともに** 整理し、どこが判断のポイントかを示します。違法・合法の断定はせず、あくまで学習・注意喚起のための **中立な"相談相手"** として、弁護士に相談する前の第一歩を支えます。

🔗 デモ: https://yomitoku-mwmw.vercel.app/

> 千葉工業大学「web3・AI概論」/ CHIBATECH PROTOTYPE

---

## できること

### 1. 法律から調べる
気になる状況を入力すると、関係しそうな法律と、Web 検索で取得した **実在の判例（出典 URL 付き）** を提示します。回答は生成されたそばからカードで表示されます。

### 2. 規約・契約から調べる
賃貸契約・就業規則・利用規約・校則などの文書を貼り付けて質問すると、**該当箇所を原文で引用しながら** 中立に整理します。会話を続けて深掘りでき、ログイン中のユーザー本人だけが見られる「マイ文書」に保存して、後から続きを聞けます。

そのほか、匿名化・集計した「みんなの相談テーマ」で、よくある疑問と回答例を眺められます。

---

## 使い方（ローカル起動）

```bash
git clone https://github.com/mwmwcreate/yomitoku.git
cd yomitoku
npm install
cp .env.example .env.local   # 各キーを設定
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 必要な環境変数（`.env.local`）

| 区分 | キー |
|---|---|
| 認証（Discord / NextAuth） | `DISCORD_CLIENT_ID` `DISCORD_CLIENT_SECRET` `NEXTAUTH_SECRET` `NEXTAUTH_URL` |
| AI | `OPENAI_API_KEY` |
| Firebase（クライアント） | `NEXT_PUBLIC_FIREBASE_API_KEY` ほか `NEXT_PUBLIC_FIREBASE_*` |
| Firebase（Admin） | `FIREBASE_CLIENT_EMAIL` `FIREBASE_PRIVATE_KEY` |

---

## 技術構成

**賢さは借りて、力仕事は自分で。**

- **フロント / フレームワーク**: Next.js 16（App Router）・React 19・TypeScript
- **スタイリング**: Tailwind CSS v4（フラットな自作デザインシステム）
- **認証**: NextAuth.js（Discord ログイン）
- **データベース**: Firebase Firestore（ユーザー別に分離して保存）
- **AI**: OpenAI API（`gpt-5.4-nano`）— 法律・規約の咀嚼と該当条項の抽出。`web_search` ツールで実在の判例を出典付きで取得。回答はストリーミング表示
- **ホスティング**: Vercel（`main` への push で自動デプロイ）

AI の"賢さ"は借りつつ、「自分の状況に合わせる・断定しない・根拠を示す」という肝の部分は、自前のプロンプト設計とデータ処理で作り込んでいます。

---

## 注意

これは **学習・注意喚起のための参考情報** を提供するアプリです。違法・合法や OK / NG を判断するものではなく、AI による整理は必ずしも正確とは限りません。大切な判断のときは、弁護士などの専門家や契約の相手にご確認ください。
