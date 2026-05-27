import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OpenAI } from 'openai';
import { db } from '@/lib/firebase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { situation } = body;

    if (!situation) {
      return NextResponse.json({ error: 'Situation is required' }, { status: 400 });
    }

    const systemPrompt = `
あなたは日本の法律に詳しいアシスタントです。ユーザーが入力した状況に対し、「関連する可能性がある法律」とその「関係性」を学習・注意喚起目的で提供してください。

【厳守事項】
1. 違法・合法、OK・OUTの判断は**絶対に**しないこと。
2. 断定的な表現を避け、「〜の可能性があります」「〜に抵触する恐れがあります」といった表現を用いること。
3. 学習目的の参考情報であることを明記し、最後に「専門家に確認してください」という注意を含めること。
4. 必ず日本の法律を前提にすること。
5. 以下のJSON形式で出力すること。

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
  "disclaimer": "これは学習目的の参考情報であり、法的な助言ではありません。違法・合法の判断を行うものではありませんので、実際の判断は弁護士などの専門家に確認してください。"
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.4-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `以下の状況に関連しそうな法律を教えてください。\n状況: ${situation}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const aiOutputText = completion.choices[0].message.content;
    if (!aiOutputText) {
      throw new Error('AI returned empty response');
    }

    const aiOutput = JSON.parse(aiOutputText);

    // Save to Firestore
    const docRef = await db.collection('analyses').add({
      userId,
      input: situation,
      output: aiOutput,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: docRef.id, result: aiOutput });
  } catch (error: any) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
