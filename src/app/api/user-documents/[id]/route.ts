import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase-admin';

const COLLECTION = 'userDocuments';

// GET: 保存文書1件の全文＋会話（本人所有のみ）
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    const d = doc.data() ?? {};
    return NextResponse.json({
      id: doc.id,
      title: typeof d.title === 'string' ? d.title : '無題の文書',
      docType: typeof d.docType === 'string' ? d.docType : 'other',
      content: typeof d.content === 'string' ? d.content : '',
      turns: Array.isArray(d.turns) ? d.turns : [],
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 });
  }
}

// DELETE: 保存文書を削除（本人所有のみ）
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const ref = db.collection(COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 });
  }
}
