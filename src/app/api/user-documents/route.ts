import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase-admin';
import { getDocumentType } from '@/lib/documentTypes';

// 「マイ文書」: ログインユーザー本人だけが見られる、私的な文書＆会話の保存。
// 他人には一切見えず、知恵袋ランキング等にも一切使わない（userId で厳密に分離）。

const MAX_DOC_CHARS = 100000;
const MAX_TURNS = 50;
const COLLECTION = 'userDocuments';

type Turn = {
  question: string;
  answer: string;
  findings: unknown[];
  checkWith: string;
  notFound: boolean;
  disclaimer: string;
};

function sanitizeTurns(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_TURNS).map((t) => {
    const o = (t ?? {}) as Record<string, unknown>;
    return {
      question: typeof o.question === 'string' ? o.question.slice(0, 500) : '',
      answer: typeof o.answer === 'string' ? o.answer.slice(0, 2000) : '',
      findings: Array.isArray(o.findings) ? o.findings.slice(0, 20) : [],
      checkWith: typeof o.checkWith === 'string' ? o.checkWith.slice(0, 200) : '',
      notFound: o.notFound === true,
      disclaimer: typeof o.disclaimer === 'string' ? o.disclaimer.slice(0, 500) : '',
    };
  });
}

// GET: 本人の保存文書一覧（メタ情報のみ）
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const snap = await db.collection(COLLECTION).where('userId', '==', userId).get();
    const items = snap.docs
      .map((doc) => {
        const d = doc.data();
        const updated = d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(d.updatedAt ?? 0);
        return {
          id: doc.id,
          title: typeof d.title === 'string' ? d.title : '無題の文書',
          docType: typeof d.docType === 'string' ? d.docType : 'other',
          turnCount: Array.isArray(d.turns) ? d.turns.length : 0,
          updatedAt: updated.toISOString(),
          _ts: updated.getTime(),
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts, ...rest }) => rest);
    return NextResponse.json({ items });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 });
  }
}

// POST: 作成 or 更新（upsert）。id があれば本人所有のものだけ更新。
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.slice(0, MAX_DOC_CHARS) : '';
  const docType = getDocumentType(body.docType).id;
  const turns = sanitizeTurns(body.turns);
  const rawTitle = typeof body.title === 'string' ? body.title.trim().slice(0, 60) : '';
  const title =
    rawTitle || content.split('\n').find((l) => l.trim())?.trim().slice(0, 24) || '無題の文書';

  if (!content.trim()) {
    return NextResponse.json({ error: '文書が空です' }, { status: 400 });
  }

  try {
    const id = typeof body.id === 'string' ? body.id : '';
    const now = new Date();

    if (id) {
      const ref = db.collection(COLLECTION).doc(id);
      const existing = await ref.get();
      if (!existing.exists || existing.data()?.userId !== userId) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }
      await ref.update({ docType, title, content, turns, updatedAt: now });
      return NextResponse.json({ id });
    }

    const ref = await db.collection(COLLECTION).add({
      userId,
      docType,
      title,
      content,
      turns,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ id: ref.id });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 });
  }
}
