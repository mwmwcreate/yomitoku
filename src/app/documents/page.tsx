"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ModeSwitch from "@/components/ModeSwitch";
import ClauseCard, { Finding } from "@/components/ClauseCard";
import ConsultationLinks from "@/components/ConsultationLinks";
import { DOCUMENT_TYPES, getDocumentType } from "@/lib/documentTypes";
import {
  Send,
  Loader2,
  FileText,
  Sparkles,
  CheckCircle2,
  SearchX,
  PhoneCall,
  Home,
  Briefcase,
  Smartphone,
  GraduationCap,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type Phase = "idle" | "analyzing" | "done";

const MAX_DOC_CHARS = 12000;

const TYPE_ICONS: Record<string, LucideIcon> = {
  rent: Home,
  work: Briefcase,
  subscription: Smartphone,
  school: GraduationCap,
  insurance: ShieldCheck,
  other: FileText,
};

export default function DocumentsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [docTypeId, setDocTypeId] = useState("rent");
  const [document, setDocument] = useState("");
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [answer, setAnswer] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [checkWith, setCheckWith] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [disclaimer, setDisclaimer] = useState("");
  const [error, setError] = useState("");

  const questionRef = useRef<HTMLInputElement>(null);

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

  const isLoading = phase === "analyzing";
  const docOver = document.length > MAX_DOC_CHARS;
  const docType = getDocumentType(docTypeId);

  const pickQuestion = (q: string) => {
    setQuestion(q);
    requestAnimationFrame(() => questionRef.current?.focus());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document.trim() || !question.trim() || isLoading) return;

    setPhase("analyzing");
    setError("");
    setStatusMsg("文書を読み込んでいます…");
    setAnswer("");
    setFindings([]);
    setCheckWith("");
    setNotFound(false);
    setDisclaimer("");

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, question, docType: docTypeId }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        const detail = data?.details || data?.error;
        throw new Error(
          detail
            ? `読み取りに失敗しました (${res.status}): ${detail}`
            : "読み取りに失敗しました。時間をおいて再度お試しください。",
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const handleEvent = (ev: string, raw: string) => {
        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(raw);
        } catch {
          return;
        }
        switch (ev) {
          case "finding":
            setFindings((prev) => [...prev, data as unknown as Finding]);
            break;
          case "status":
            if (typeof data.message === "string") setStatusMsg(data.message);
            break;
          case "done": {
            const r = data.result as
              | {
                  answer?: string;
                  findings?: Finding[];
                  checkWith?: string;
                  notFound?: boolean;
                  disclaimer?: string;
                }
              | undefined;
            if (r) {
              setAnswer(r.answer ?? "");
              if (Array.isArray(r.findings)) setFindings(r.findings);
              setCheckWith(r.checkWith ?? "");
              setNotFound(r.notFound === true);
              setDisclaimer(r.disclaimer ?? "");
            }
            setPhase("done");
            break;
          }
          case "error":
            setError(
              typeof data.message === "string"
                ? `読み取りに失敗しました: ${data.message}`
                : "読み取りに失敗しました。",
            );
            setPhase("idle");
            break;
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, sep);
          buf = buf.slice(sep + 2);
          let evName = "message";
          const dataLines: string[] = [];
          for (const line of chunk.split("\n")) {
            if (line.startsWith("event:")) evName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
          }
          if (dataLines.length) handleEvent(evName, dataLines.join("\n"));
        }
      }

      setPhase((p) => (p === "analyzing" ? "done" : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み取りに失敗しました。");
      setPhase("idle");
    }
  };

  const showResults = findings.length > 0 || phase === "done";

  return (
    <div className="min-h-screen bg-[var(--primary-lighter)]">
      <Header />
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="mb-8 animate-fade-in-up">
          <ModeSwitch />
        </div>

        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[var(--primary)]" />
            規約・契約から調べる
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            賃貸契約・就業規則・利用規約・校則などの文書を貼り付けて質問すると、AIが該当箇所を引用しながら中立に整理します。違法・合法やOK/ダメの判断はしません。
          </p>
        </div>

        {/* 免責（このモード用に文言を調整） */}
        <div className="mb-8 bg-[var(--amber-bg)] border border-[var(--amber-border)]/30 px-6 py-4 rounded-2xl animate-fade-in-up delay-100">
          <p className="text-[13px] text-[var(--amber-text-light)] leading-relaxed">
            これは<strong>文書に書かれている内容を整理する参考情報</strong>です。最終的な可否や法的な判断ではありません。貼り付けた文書はサーバーに保存されません。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[var(--border)] p-7 md:p-9 mb-10 animate-fade-in-up delay-200 space-y-6"
        >
          {/* 文書の種類 */}
          <div>
            <label className="text-base font-bold text-[var(--foreground)] block mb-2.5">① 文書の種類</label>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((t) => {
                const Icon = TYPE_ICONS[t.id] ?? FileText;
                const active = t.id === docTypeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDocTypeId(t.id)}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-2 border transition-colors duration-300 disabled:opacity-40 ${
                      active
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--primary-lighter)] hover:text-[var(--primary-dark)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 文書 */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-base font-bold text-[var(--foreground)]">② 文書を貼り付け</label>
              <span className={`text-[11px] tabular-nums ${docOver ? "text-red-500" : "text-[var(--text-light)]"}`}>
                {document.length.toLocaleString()} / {MAX_DOC_CHARS.toLocaleString()}字
              </span>
            </div>
            <textarea
              className="w-full h-48 p-5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none resize-none text-[var(--foreground)] placeholder-[var(--text-light)] text-sm leading-relaxed transition-all duration-300"
              placeholder={docType.placeholder}
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              disabled={isLoading}
            />
            {docOver && (
              <p className="text-[11px] text-red-500 mt-1.5">
                長いため、分析では先頭{MAX_DOC_CHARS.toLocaleString()}字のみ読み込まれます。該当しそうな部分に絞って貼ると精度が上がります。
              </p>
            )}
          </div>

          {/* 質問 */}
          <div>
            <label className="text-base font-bold text-[var(--foreground)] block mb-2.5">③ 聞きたいこと</label>
            <input
              ref={questionRef}
              type="text"
              className="w-full p-4 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-[var(--foreground)] placeholder-[var(--text-light)] text-sm transition-all duration-300"
              placeholder={`例: ${docType.starters[0]}`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
            <div className="mt-3">
              <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                よくある質問から
              </p>
              <div className="flex flex-wrap gap-2">
                {docType.starters.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => pickQuestion(q)}
                    disabled={isLoading}
                    className="text-xs text-[var(--text-muted)] bg-[var(--primary-lighter)] hover:bg-[var(--primary-light)] hover:text-[var(--primary-dark)] border border-[var(--border)] rounded-full px-3.5 py-2 transition-colors duration-300 disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !document.trim() || !question.trim()}
              className="flex items-center gap-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-7 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-[var(--primary)]/15 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isLoading ? "読み取り中..." : "文書から調べる"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm p-4 bg-red-50 rounded-xl">{error}</p>}
        </form>

        {isLoading && findings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center">
              <FileText className="w-7 h-7 text-[var(--primary)] animate-pulse" />
            </div>
            <p className="mt-6 text-sm text-[var(--text-muted)]">{statusMsg}</p>
            <p className="mt-1 text-xs text-[var(--text-light)]">該当箇所が見つかり次第、順に表示します</p>
          </div>
        )}

        {showResults && (
          <div className="space-y-6">
            {/* ざっくり結論 */}
            {phase === "done" && answer && (
              <div className="bg-white rounded-2xl border border-[var(--border)] p-6 md:p-7 animate-fade-in-up">
                <h2 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                  ざっくり言うと
                </h2>
                <p className="text-sm text-[var(--foreground)] leading-[1.9]">{answer}</p>
              </div>
            )}

            {findings.length > 0 ? (
              <>
                <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2 animate-fade-in-up">
                  文書の該当箇所
                  {isLoading && <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />}
                </h2>
                <div className="grid gap-6">
                  {findings.map((f, idx) => (
                    <ClauseCard key={idx} finding={f} index={idx} />
                  ))}
                </div>
              </>
            ) : (
              phase === "done" &&
              notFound && (
                <div className="bg-white rounded-2xl border border-[var(--border)] p-10 text-center animate-fade-in-up">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-5">
                    <SearchX className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">この文書には、その質問に関する明確な記載が見当たりませんでした。</p>
                  <p className="text-xs text-[var(--text-light)] mt-2">別の言い方で質問するか、関連しそうな章を貼り直してみてください。</p>
                </div>
              )
            )}

            {phase === "done" && checkWith && (
              <div className="bg-[#f6fefb] rounded-2xl border border-[#059669]/20 p-5 flex items-start gap-3 animate-fade-in-up">
                <span className="w-9 h-9 rounded-xl bg-[#ecfdf5] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4 text-[#059669]" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">最終確認はこちらへ</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">{checkWith}</p>
                </div>
              </div>
            )}

            {phase === "done" && <ConsultationLinks />}

            {phase === "done" && disclaimer && (
              <div className="bg-white p-6 rounded-2xl text-[13px] text-[var(--text-muted)] border border-[var(--border)] leading-relaxed animate-fade-in-up">
                {disclaimer}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
