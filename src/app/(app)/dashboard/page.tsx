"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DisclaimerAlert from "@/components/DisclaimerAlert";
import LawCard, { Law } from "@/components/LawCard";
import PrecedentCard, { Precedent } from "@/components/PrecedentCard";
import TopicRanking from "@/components/TopicRanking";
import ConsultationLinks from "@/components/ConsultationLinks";
import { Send, Loader2, Scale, Gavel, Sparkles, MessageCirclePlus } from "lucide-react";

type Phase = "idle" | "analyzing" | "done";

// 空欄だと「何を書けばいいか分からない」ので、入口になる相談例を用意する。
const STARTER_EXAMPLES = [
  "電動キックボードで歩道を走ってしまった。これって問題ある？",
  "退職を伝えたら『損害賠償する』と会社に言われた。",
  "ネットで買った商品が説明と全然違った。返品できる？",
  "SNSに自分の悪口を書かれた。消してもらえる？",
];

// 結果を見たあとの「で、どうすれば？」に応える深掘りの切り口。
const FOLLOW_UPS = [
  "つまり、私は何に気をつければいい？",
  "もし相手が納得してくれなかったら？",
  "穏便に解決するにはどうしたらいい？",
  "証拠として残しておくべきものは？",
];

export default function Dashboard() {
  const { status } = useSession();
  const router = useRouter();

  const [situation, setSituation] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [laws, setLaws] = useState<Law[]>([]);
  const [precedents, setPrecedents] = useState<Precedent[]>([]);
  const [disclaimer, setDisclaimer] = useState("");
  const [error, setError] = useState("");

  const inputCardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
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

  const focusInput = (text: string) => {
    setSituation(text);
    inputCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const appendFollowUp = (text: string) => {
    focusInput(`${situation.trim()}\n\n（追加で聞きたいこと）${text}`);
  };

  const isLoading = phase === "analyzing";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation.trim() || isLoading) return;

    setPhase("analyzing");
    setError("");
    setStatusMsg("AIが関連法律を分析しています…");
    setLaws([]);
    setPrecedents([]);
    setDisclaimer("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        const detail = data?.details || data?.error;
        throw new Error(
          detail
            ? `分析に失敗しました (${res.status}): ${detail}`
            : "分析に失敗しました。時間をおいて再度お試しください。",
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const handleEvent = (rawEvent: string, rawData: string) => {
        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(rawData);
        } catch {
          return;
        }
        switch (rawEvent) {
          case "law":
            setLaws((prev) => [...prev, data as unknown as Law]);
            break;
          case "precedent":
            setPrecedents((prev) => [...prev, data as unknown as Precedent]);
            break;
          case "status":
            if (typeof data.message === "string") setStatusMsg(data.message);
            break;
          case "done": {
            const result = data.result as
              | { laws?: Law[]; precedents?: Precedent[]; disclaimer?: string }
              | undefined;
            if (result) {
              if (Array.isArray(result.laws)) setLaws(result.laws);
              if (Array.isArray(result.precedents)) setPrecedents(result.precedents);
              setDisclaimer(result.disclaimer ?? "");
            }
            setPhase("done");
            break;
          }
          case "error":
            setError(
              typeof data.message === "string"
                ? `分析に失敗しました: ${data.message}`
                : "分析に失敗しました。",
            );
            setPhase("idle");
            break;
        }
      };

      // SSE（event: / data: の2行 + 空行区切り）を逐次パース
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, sep);
          buf = buf.slice(sep + 2);
          let ev = "message";
          const dataLines: string[] = [];
          for (const line of chunk.split("\n")) {
            if (line.startsWith("event:")) ev = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
          }
          if (dataLines.length) handleEvent(ev, dataLines.join("\n"));
        }
      }

      // ストリームが done を送らずに終了した場合の保険
      setPhase((p) => (p === "analyzing" ? "done" : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析に失敗しました。");
      setPhase("idle");
    }
  };

  const showLaws = laws.length > 0;
  // 判例セクションは「判例あり」「完了」に加え、法律カードが出た後の検索中も表示して進捗を見せる
  const showPrecedentSection = precedents.length > 0 || phase === "done" || (isLoading && showLaws);

  return (
    <main className="max-w-6xl mx-auto px-6 md:px-10 pt-8 pb-12 md:pb-16">
      <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
          <TopicRanking
            onUseExample={focusInput}
            className="order-2 lg:order-1 mt-10 lg:mt-0 w-full lg:w-[300px] lg:shrink-0 lg:sticky lg:top-24"
          />
          <div className="order-1 lg:order-2 lg:flex-1 lg:min-w-0">
            <div className="mb-10 animate-fade-in-up">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">法律から調べる</h1>
              <p className="text-sm text-[var(--text-muted)]">気になる状況を入力して、関連する法律を調べてみましょう。</p>
            </div>
            <div className="mb-10 animate-fade-in-up delay-100">
              <DisclaimerAlert />
            </div>
            <div
              ref={inputCardRef}
              className="bg-[var(--surface)] rounded-[20px] p-7 md:p-9 mb-10 animate-fade-in-up delay-200 scroll-mt-24"
            >
              <h2 className="text-base font-bold mb-5 text-[var(--foreground)]">状況を入力</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <textarea
                  ref={textareaRef}
                  className="w-full h-36 p-5 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] focus:border-[var(--deep-blue)] focus:bg-[var(--soft-blue)] outline-none resize-none text-[var(--foreground)] placeholder-[var(--text-light)] text-sm leading-relaxed transition-all duration-300"
                  placeholder="例: 友達から借りたゲームソフトを、別の友達に貸してお金をもらった。これって大丈夫？"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  disabled={isLoading}
                />

                {/* 空欄のときだけ、入口になる相談例を出す */}
                {!situation.trim() && !isLoading && (
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-2.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                      例えばこんな相談から
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {STARTER_EXAMPLES.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => focusInput(ex)}
                          className="text-left text-xs text-[var(--text-muted)] bg-[var(--pale-gray)] hover:bg-[var(--soft-blue)] hover:text-[var(--deep-blue)] rounded-full px-3.5 py-2 leading-snug transition-colors duration-300"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="submit" disabled={isLoading || !situation.trim()} className="flex items-center gap-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-7 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isLoading ? "分析中..." : "分析する"}
                  </button>
                </div>
              </form>
              {error && <p className="text-red-500 text-sm mt-5 p-4 bg-red-50 rounded-xl">{error}</p>}
            </div>

            {/* 最初の法律カードが届くまでのプレースホルダ */}
            {isLoading && !showLaws && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center">
                    <Scale className="w-7 h-7 text-[var(--primary)] animate-pulse" />
                  </div>
                </div>
                <p className="mt-6 text-sm text-[var(--text-muted)]">{statusMsg}</p>
                <p className="mt-1 text-xs text-[var(--text-light)]">わかったものから順に表示します</p>
              </div>
            )}

            {(showLaws || phase === "done") && (
              <div className="space-y-6">
                {showLaws && (
                  <>
                    <h2 className="text-lg font-bold text-[var(--foreground)] animate-fade-in-up flex items-center gap-2">
                      関連する可能性のある法律
                      {isLoading && <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />}
                    </h2>
                    <div className="grid gap-6">
                      {laws.map((law, idx) => (
                        <LawCard key={idx} law={law} index={idx} />
                      ))}
                    </div>
                  </>
                )}

                {showPrecedentSection && (
                  <section className="mt-10 px-6 md:px-8 py-9 md:py-10 bg-[var(--pale-gray)] rounded-[24px] animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-7">
                      <span className="w-11 h-11 rounded-2xl bg-[var(--surface)] flex items-center justify-center">
                        <Gavel className="w-5 h-5 text-[var(--deep-blue)]" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-[var(--text)]">類似する過去の判例</h2>
                        <p className="text-xs text-[var(--muted)] mt-0.5">Web検索で取得した実在の裁判例(出典URL付き)</p>
                      </div>
                    </div>
                    {precedents.length > 0 ? (
                      <div className="grid gap-4">
                        {precedents.map((p, idx) => (<PrecedentCard key={idx} precedent={p} index={idx} />))}
                      </div>
                    ) : isLoading ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--muted)]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {statusMsg}
                      </div>
                    ) : (
                      <div className="bg-[var(--surface)] rounded-2xl p-8 text-center">
                        <p className="text-sm text-[var(--muted)]">今回の状況に類似する判例は見つかりませんでした。</p>
                        <p className="text-xs text-[var(--muted-light)] mt-2">Web検索で実在の判例が確認できなかったため、判例の提示は行いません。</p>
                      </div>
                    )}
                  </section>
                )}

                {phase === "done" && (
                  <>
                    {/* フォローアップ：結果を見たあとの「で、どうすれば？」に応える */}
                    <section className="bg-[var(--surface)] rounded-[20px] p-6 md:p-7 animate-fade-in-up">
                      <h3 className="text-sm font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
                        <MessageCirclePlus className="w-4 h-4 text-[var(--primary)]" />
                        さらに深掘りして聞く
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] mb-4">クリックすると入力欄に追記されます。内容を整えて、もう一度「分析する」を押してください。</p>
                      <div className="flex flex-wrap gap-2">
                        {FOLLOW_UPS.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => appendFollowUp(q)}
                            className="text-xs text-[var(--text-muted)] bg-[var(--pale-gray)] hover:bg-[var(--soft-blue)] hover:text-[var(--deep-blue)] rounded-full px-3.5 py-2 transition-colors duration-300"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </section>

                    <ConsultationLinks />

                    {disclaimer && (
                      <div className="bg-[var(--surface)] p-6 rounded-[20px] text-[13px] text-[var(--muted)] mt-2 leading-relaxed animate-fade-in-up">
                        {disclaimer}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
  );
}
