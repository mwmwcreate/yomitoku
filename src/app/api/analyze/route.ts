import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OpenAI } from 'openai';
import { db } from '@/lib/firebase-admin';
import { CATEGORY_INSTRUCTION, normalizeCategory } from '@/lib/topicCategories';
import { extractArrayObjects } from '@/lib/streamParse';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
});

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let situation: unknown;
  try {
    ({ situation } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!situation || typeof situation !== 'string') {
    return NextResponse.json({ error: 'Situation is required' }, { status: 400 });
  }
  const situationText = situation;

  const instructions = `
あなたは日本の法律に詳しいアシスタントです。ユーザーが入力した状況に対し、「関連する可能性がある法律」とその「関係性」、さらに「類似する実際の日本の判例(前例)」を学習・注意喚起目的で提供してください。

【厳守事項】
1. 違法・合法、OK・OUTの判断は**絶対に**しないこと。
2. 断定的な表現を避け、「〜の可能性があります」「〜に抵触する恐れがあります」といった表現を用いること。
3. 学習目的の参考情報であることを明記し、最後に「専門家に確認してください」という注意を含めること。
4. 必ず日本の法律を前提にすること。

【判例(precedents)について】
- web_search ツールを使って、信頼できる情報源(裁判所Webサイト courts.go.jp、e-Gov、判例検索サイト、弁護士事務所の解説記事など)から**実在の日本の裁判例**を最大3件まで取得してください。
- 架空の判例や、出典が不明な事例は**絶対に含めない**でください。
- 各判例には必ず出典URLを含めてください。URLが取得できない場合はその判例は出力しないでください。
- 判例が見つからない場合は precedents を空配列([])にしてください。捏造は厳禁。
${CATEGORY_INSTRUCTION}

以下のJSON形式で**厳密に**出力してください(JSON以外の説明文は不要)。
カードを早く表示するため、必ず "laws" を先に、その後 "precedents" を出力してください:

{
  "laws": [
    {
      "name": "法律名（例: 著作権法）",
      "description": "その法律の簡単な説明",
      "relevance": "高 または 中 または 低",
      "relation": "入力された状況とどう関係しそうか",
      "caution": "注意点（断定を避けること）"
    }
  ],
  "precedents": [
    {
      "title": "判例の通称または事件名",
      "court": "裁判所名",
      "date": "判決日",
      "summary": "事案と判旨の簡潔な要約（150〜250字程度）",
      "relation": "今回の状況とどう似ているか・どう異なるか",
      "url": "出典URL（必須）"
    }
  ],
  "category": "上記のジャンルidのいずれか（必須。判断できなければ other）",
  "categorySuggestion": "category が other のときのみ短いジャンル名、それ以外は空文字",
  "summary": "個人が特定されない、抽象化された相談の要約（40〜60字程度の1文）",
  "disclaimer": "これは学習目的の参考情報であり、法的な助言ではありません。違法・合法の判断を行うものではありませんので、実際の判断は弁護士などの専門家に確認してください。"
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
        const aiStream = await openai.responses.create({
          model: 'gpt-5.4-nano',
          instructions,
          input: `以下の状況に関連しそうな法律と、類似する実在の日本の判例を教えてください。\n出力は指定したJSONオブジェクトのみで、前置きやコードフェンス(\`\`\`)は一切含めないでください。\n状況: ${situationText}`,
          tools: [{ type: 'web_search' }],
          temperature: 0.2,
          stream: true,
        });

        let buffer = '';
        let lawsEmitted = 0;
        let precsEmitted = 0;
        let searchAnnounced = false;

        for await (const event of aiStream) {
          if (event.type === 'response.output_text.delta') {
            buffer += event.delta;
            const lr = extractArrayObjects(buffer, 'laws');
            for (let k = lawsEmitted; k < lr.objects.length; k++) send('law', lr.objects[k]);
            lawsEmitted = lr.objects.length;
            const pr = extractArrayObjects(buffer, 'precedents');
            for (let k = precsEmitted; k < pr.objects.length; k++) send('precedent', pr.objects[k]);
            precsEmitted = pr.objects.length;
          } else if (event.type === 'response.web_search_call.in_progress' && !searchAnnounced) {
            searchAnnounced = true;
            send('status', { message: '実在の判例をWeb検索しています…' });
          }
        }

        if (!buffer.trim()) throw new Error('AI returned empty response');

        // 全文を権威データとしてパース（増分で取りこぼした分の最終確定）
        let aiOutput: Record<string, unknown>;
        try {
          aiOutput = JSON.parse(buffer);
        } catch {
          const match = buffer.match(/\{[\s\S]*\}/);
          if (!match) throw new Error('AI output is not valid JSON');
          aiOutput = JSON.parse(match[0]);
        }

        if (!Array.isArray(aiOutput.laws)) aiOutput.laws = [];
        if (!Array.isArray(aiOutput.precedents)) aiOutput.precedents = [];

        const category = normalizeCategory(aiOutput.category);
        const suggestionRaw = aiOutput.categorySuggestion;
        const categorySuggestion =
          category === 'other' && typeof suggestionRaw === 'string'
            ? suggestionRaw.trim().slice(0, 50)
            : '';
        const summaryRaw = aiOutput.summary;
        const summary = typeof summaryRaw === 'string' ? summaryRaw.trim().slice(0, 120) : '';
        const disclaimer = typeof aiOutput.disclaimer === 'string' ? aiOutput.disclaimer : '';

        const docRef = await db.collection('analyses').add({
          userId,
          input: situationText,
          output: aiOutput,
          category,
          categorySuggestion,
          summary,
          createdAt: new Date(),
        });

        // 確定結果を送り、クライアントの表示を権威データに揃える
        send('done', {
          id: docRef.id,
          result: {
            laws: aiOutput.laws,
            precedents: aiOutput.precedents,
            disclaimer,
          },
        });
      } catch (error) {
        console.error('Analyze API error:', error);
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
