import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase-admin';

// ランキングの相談例クリックで、そのときのAI回答を表示するためのAPI。
// プライバシー: 生の入力文 input と userId は絶対に返さない。
// 返すのは匿名化済み summary と AIの回答（laws / precedents / disclaimer）のみ。

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await db.collection('analyses').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const data = doc.data() ?? {};
    const output = (data.output ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      summary: typeof data.summary === 'string' ? data.summary : '',
      category: typeof data.category === 'string' ? data.category : 'other',
      laws: Array.isArray(output.laws) ? output.laws : [],
      precedents: Array.isArray(output.precedents) ? output.precedents : [],
      disclaimer: typeof output.disclaimer === 'string' ? output.disclaimer : '',
    });
  } catch (error) {
    console.error('Analysis detail API error:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal Server Error', details },
      { status: 500 },
    );
  }
}
