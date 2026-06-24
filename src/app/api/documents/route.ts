import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OpenAI } from 'openai';
import { extractArrayObjects } from '@/lib/streamParse';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
});

export const maxDuration = 60;

// コスト対策の要: 1リクエストで読み込む文書量を確定的に頭打ちにする。
const MAX_DOC_CHARS = 12000;
const MAX_QUESTION_CHARS = 500;

// プライバシー: 貼られた文書には個人情報が含まれうるため、Firestoreに保存しない。
// 履歴にも知恵袋ランキングにも一切載せない（法律モードとは完全に分離）。

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { document?: unknown; question?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const document = typeof body.document === 'string' ? body.document : '';
  const question = typeof body.question === 'string' ? body.question : '';

  if (!document.trim()) {
    return NextResponse.json({ error: '文書が入力されていません' }, { status: 400 });
  }
  if (!question.trim()) {
    return NextResponse.json({ error: '質問が入力されていません' }, { status: 400 });
  }

  const truncated = document.length > MAX_DOC_CHARS;
  const doc = truncated ? document.slice(0, MAX_DOC_CHARS) : document;
  const q = question.slice(0, MAX_QUESTION_CHARS);

  const instructions = `
あなたは、ユーザーが提示した「賃貸契約書・管理規約などの規約文書」を読み解くアシスタントです。
ユーザーの質問に対し、**提示された文書の記載だけ**を根拠に、中立に答えてください。

【厳守事項】
1. 違法・合法、OK・ダメ、可・不可の**最終判断は絶対にしない**。「〜と記載されています」「〜と読める可能性があります」という中立・非断定の表現を使う。
2. 回答の根拠は、**提示された文書中に実際に書かれている文言のみ**。文書に無い条項・数値・ルールを**創作しない**。
3. 引用(quote)は、文書から該当箇所を**原文のまま**抜き出す（要約・改変しない）。長い場合は該当する一文〜数文に絞る。
4. 文書にその質問に関する記載が見当たらない場合は notFound を true にし、findings は空配列にする。推測で埋めない。
5. 一般論や法律論ではなく、**この文書に何が書いてあるか**に徹する。最終的な取り扱いは契約相手に確認するよう促す。

以下のJSON形式で**厳密に**出力してください(JSON以外の説明文は不要):

{
  "answer": "質問への結論を、断定せず1〜3文で。文書に記載が無ければ『この文書には明確な記載が見当たりません』と述べる。",
  "findings": [
    {
      "quote": "文書から該当箇所を原文のまま抜粋",
      "location": "第○条・第○項など（文書から分かる場合のみ。不明なら空文字）",
      "explanation": "この箇所が質問にどう関係し、どう読めるか。中立・非断定で説明する。"
    }
  ],
  "checkWith": "最終的に確認すべき相手（例: 管理会社・貸主・不動産会社）",
  "notFound": false,
  "disclaimer": "これは提示された文書の記載を整理した参考情報であり、法的な助言や最終的な判断ではありません。実際の取り扱いは契約相手や専門家にご確認ください。"
}
`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      try {
        if (truncated) {
          send('status', {
            message: `文書が長いため、先頭${MAX_DOC_CHARS.toLocaleString()}字のみ読み込みました。`,
          });
        }

        const aiStream = await openai.responses.create({
          model: 'gpt-5.4-nano',
          instructions,
          input: `# 文書\n${doc}\n\n# 質問\n${q}\n\n出力は指定したJSONオブジェクトのみ。前置きやコードフェンス(\`\`\`)は含めないこと。`,
          temperature: 0.1,
          stream: true,
        });

        let buffer = '';
        let findingsEmitted = 0;

        for await (const event of aiStream) {
          if (event.type === 'response.output_text.delta') {
            buffer += event.delta;
            const fr = extractArrayObjects(buffer, 'findings');
            for (let k = findingsEmitted; k < fr.objects.length; k++) {
              send('finding', fr.objects[k]);
            }
            findingsEmitted = fr.objects.length;
          }
        }

        if (!buffer.trim()) throw new Error('AI returned empty response');

        let out: Record<string, unknown>;
        try {
          out = JSON.parse(buffer);
        } catch {
          const match = buffer.match(/\{[\s\S]*\}/);
          if (!match) throw new Error('AI output is not valid JSON');
          out = JSON.parse(match[0]);
        }

        if (!Array.isArray(out.findings)) out.findings = [];

        send('done', {
          result: {
            answer: typeof out.answer === 'string' ? out.answer : '',
            findings: out.findings,
            checkWith: typeof out.checkWith === 'string' ? out.checkWith : '',
            notFound: out.notFound === true,
            disclaimer: typeof out.disclaimer === 'string' ? out.disclaimer : '',
          },
        });
      } catch (error) {
        console.error('Documents API error:', error);
        const details = error instanceof Error ? error.message : String(error);
        send('error', { message: details });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
