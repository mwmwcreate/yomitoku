import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import Header from "@/components/Header";
import { Law } from "@/components/LawCard";
import { Clock, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

type HistoryItem = {
  id: string;
  input: string;
  output: { laws: Law[]; disclaimer: string };
  createdAt: string;
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  const userId = (session.user as any).id;

  let history: HistoryItem[] = [];
  try {
    const snapshot = await db
      .collection("analyses")
      .where("userId", "==", userId)
      .get();

    const allRecords = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Firestore Timestamp has toDate(), fallback to new Date() if it's already a JS date or missing
      const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
      
      return {
        id: doc.id,
        input: data.input,
        output: data.output,
        timestamp: dateObj.getTime(),
        createdAt: dateObj.toLocaleString("ja-JP"),
      };
    });

    // JavaScript側でソートして最新50件を取得（Firestoreの複合インデックスエラーを回避）
    history = allRecords
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
      .map(({ timestamp, ...rest }) => rest);
  } catch (error) {
    console.error("Failed to fetch history:", error);
    // Continue with empty history if error
  }

  return (
    <div className="min-h-screen bg-[var(--primary-lighter)]">
      <Header />

      <main className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-16">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
                <Clock className="text-[var(--primary)] w-5 h-5" />
              </span>
              分析履歴
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-2 pl-[52px]">
              過去の分析結果を確認できます
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1.5 transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Link>
        </div>

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <p className="text-[var(--text-muted)] text-sm">
              まだ履歴がありません。
            </p>
            <p className="text-[var(--text-light)] text-xs mt-1">
              ダッシュボードから分析を行ってみましょう。
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-6 text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium transition-colors duration-300"
            >
              ダッシュボードへ →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((item, i) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-[var(--card-shadow-hover)] transition-all duration-500"
              >
                {/* Date Header */}
                <div className="px-7 py-4 border-b border-[var(--border-light)] flex justify-between items-center">
                  <span className="text-xs text-[var(--text-light)]">
                    {item.createdAt}
                  </span>
                </div>

                <div className="p-7 space-y-5">
                  {/* Input */}
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5">
                      入力された状況
                    </h4>
                    <p className="text-sm text-[var(--foreground)] bg-[var(--primary-lighter)] p-4 rounded-xl leading-relaxed">
                      {item.input}
                    </p>
                  </div>

                  {/* Laws */}
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-3">
                      検出された法律
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {item.output?.laws?.map((law, idx) => (
                        <span
                          key={idx}
                          className="bg-[var(--primary-light)] text-[var(--primary)] px-4 py-1.5 rounded-full text-xs font-medium"
                        >
                          {law.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
