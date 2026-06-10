"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import DisclaimerAlert from "@/components/DisclaimerAlert";
import LawCard, { Law } from "@/components/LawCard";
import PrecedentCard, { Precedent } from "@/components/PrecedentCard";
import TopicRanking from "@/components/TopicRanking";
import { Send, Loader2, Scale, Gavel } from "lucide-react";

export default function Dashboard() {
  const { status } = useSession();
  const router = useRouter();

  const [situation, setSituation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ laws: Law[]; precedents?: Precedent[]; disclaimer: string } | null>(null);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
          <span className="text-sm text-[var(--text-muted)]">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation.trim()) return;
    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const detail = data?.details || data?.error;
        throw new Error(detail ? `分析に失敗しました (${res.status}): ${detail}` : "分析に失敗しました。時間をおいて再度お試しください。");
      }
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--primary-lighter)]">
      <Header />
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
          <TopicRanking className="order-2 lg:order-1 mt-10 lg:mt-0 w-full lg:w-[300px] lg:shrink-0 lg:sticky lg:top-24" />
          <div className="order-1 lg:order-2 lg:flex-1 lg:min-w-0">
            <div className="mb-10 animate-fade-in-up">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">法律ナビ</h1>
              <p className="text-sm text-[var(--text-muted)]">気になる状況を入力して、関連する法律を調べてみましょう。</p>
            </div>
            <div className="mb-10 animate-fade-in-up delay-100">
              <DisclaimerAlert />
            </div>
            <div className="bg-white rounded-2xl border border-[var(--border)] p-7 md:p-9 mb-10 animate-fade-in-up delay-200">
              <h2 className="text-base font-bold mb-5 text-[var(--foreground)]">状況を入力</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <textarea
                  className="w-full h-36 p-5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none resize-none text-[var(--foreground)] placeholder-[var(--text-light)] text-sm leading-relaxed transition-all duration-300"
                  placeholder="例: 友達から借りたゲームソフトを、別の友達に貸してお金をもらった。これって大丈夫？"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  disabled={isLoading}
                />
                <div className="flex justify-end">
                  <button type="submit" disabled={isLoading || !situation.trim()} className="flex items-center gap-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-7 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-[var(--primary)]/15 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isLoading ? "分析中..." : "分析する"}
                  </button>
                </div>
              </form>
              {error && <p className="text-red-500 text-sm mt-5 p-4 bg-red-50 rounded-xl">{error}</p>}
            </div>
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center">
                    <Scale className="w-7 h-7 text-[var(--primary)] animate-pulse" />
                  </div>
                </div>
                <p className="mt-6 text-sm text-[var(--text-muted)]">AIが関連法律を分析しています...</p>
                <p className="mt-1 text-xs text-[var(--text-light)]">数秒〜十数秒ほどお待ちください</p>
              </div>
            )}
            {result && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-[var(--foreground)] animate-fade-in-up">関連する可能性のある法律</h2>
                <div className="grid gap-6">
                  {result.laws.map((law, idx) => (<LawCard key={idx} law={law} index={idx} />))}
                </div>
                {result.precedents !== undefined && (
                  <section className="relative mt-12 px-6 md:px-8 py-10 md:py-12 bg-[#fbf7ec] rounded-3xl border border-[#ede2c4]/60 animate-fade-in-up">
                    <div className="flex items-center gap-3.5 mb-8">
                      <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center ring-1 ring-[#ede2c4] shadow-sm">
                        <Gavel className="w-5 h-5 text-[#8b6f30]" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-[var(--foreground)]">類似する過去の判例</h2>
                        <p className="text-xs text-[#8b6f30]/70 mt-0.5">Web検索で取得した実在の裁判例(出典URL付き)</p>
                      </div>
                    </div>
                    {result.precedents.length > 0 ? (
                      <div className="grid gap-6">
                        {result.precedents.map((p, idx) => (<PrecedentCard key={idx} precedent={p} index={idx} />))}
                      </div>
                    ) : (
                      <div className="bg-white/70 rounded-2xl border border-[#ede2c4]/60 p-8 text-center">
                        <p className="text-sm text-[var(--text-muted)]">今回の状況に類似する判例は見つかりませんでした。</p>
                        <p className="text-xs text-[var(--text-light)] mt-2">Web検索で実在の判例が確認できなかったため、判例の提示は行いません。</p>
                      </div>
                    )}
                  </section>
                )}
                <div className="bg-white p-6 rounded-2xl text-[13px] text-[var(--text-muted)] border border-[var(--border)] mt-10 leading-relaxed animate-fade-in-up">
                  {result.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
