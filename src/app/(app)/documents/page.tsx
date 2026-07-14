"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  Save,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";

type Phase = "idle" | "analyzing";

type Turn = {
  question: string;
  answer: string;
  findings: Finding[];
  checkWith: string;
  notFound: boolean;
  disclaimer: string;
};

type SavedMeta = {
  id: string;
  title: string;
  docType: string;
  turnCount: number;
  updatedAt: string;
};

const MAX_DOC_CHARS = 100000;

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

  const [savedList, setSavedList] = useState<SavedMeta[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  const [docTypeId, setDocTypeId] = useState("rent");
  const [document, setDocument] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [pendingFindings, setPendingFindings] = useState<Finding[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const questionRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/user-documents");
      const data = await res.json().catch(() => null);
      if (res.ok && data?.items) setSavedList(data.items);
    } catch {
      /* 一覧の取得失敗は致命的でないので無視 */
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") refreshList();
  }, [status, refreshList]);

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

  const isLoading = phase === "analyzing";
  const docOver = document.length > MAX_DOC_CHARS;
  const docType = getDocumentType(docTypeId);
  const hasConversation = turns.length > 0;

  const pickQuestion = (q: string) => {
    setQuestion(q);
    requestAnimationFrame(() => questionRef.current?.focus());
  };

  const saveDoc = async (nextTurns: Turn[], explicit = false) => {
    // 既存（id あり）の場合は会話追記のたびに自動保存。新規は「保存」ボタン押下時のみ。
    if (!currentDocId && !explicit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDocId ?? undefined,
          docType: docTypeId,
          content: document,
          turns: nextTurns,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.id) {
        if (!currentDocId) setCurrentDocId(data.id);
        refreshList();
      }
    } catch {
      /* 保存失敗は致命的でないので無視（会話は画面に残る） */
    } finally {
      setSaving(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document.trim() || !question.trim() || isLoading) return;

    const asked = question;
    setPhase("analyzing");
    setError("");
    setStatusMsg("文書を読み込んでいます…");
    setPendingFindings([]);
    setPendingQuestion(asked);
    setQuestion("");
    requestAnimationFrame(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }));

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document,
          question: asked,
          docType: docTypeId,
          history: turns.map((t) => ({ question: t.question, answer: t.answer })),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        const detail = data?.details || data?.error;
        throw new Error(detail ? `読み取りに失敗しました (${res.status}): ${detail}` : "読み取りに失敗しました。");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let liveFindings: Finding[] = [];
      let finalTurn: Turn | null = null;

      const handleEvent = (ev: string, raw: string) => {
        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(raw);
        } catch {
          return;
        }
        switch (ev) {
          case "finding":
            liveFindings = [...liveFindings, data as unknown as Finding];
            setPendingFindings(liveFindings);
            break;
          case "status":
            if (typeof data.message === "string") setStatusMsg(data.message);
            break;
          case "done": {
            const r = data.result as
              | { answer?: string; findings?: Finding[]; checkWith?: string; notFound?: boolean; disclaimer?: string }
              | undefined;
            finalTurn = {
              question: asked,
              answer: r?.answer ?? "",
              findings: Array.isArray(r?.findings) ? (r!.findings as Finding[]) : liveFindings,
              checkWith: r?.checkWith ?? "",
              notFound: r?.notFound === true,
              disclaimer: r?.disclaimer ?? "",
            };
            break;
          }
          case "error":
            setError(typeof data.message === "string" ? `読み取りに失敗しました: ${data.message}` : "読み取りに失敗しました。");
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

      if (finalTurn) {
        const nextTurns = [...turns, finalTurn];
        setTurns(nextTurns);
        saveDoc(nextTurns); // 既に保存済みの文書なら自動保存
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み取りに失敗しました。");
    } finally {
      setPhase("idle");
      setPendingQuestion("");
      setPendingFindings([]);
    }
  };

  const handleNew = () => {
    setCurrentDocId(null);
    setDocument("");
    setTurns([]);
    setQuestion("");
    setError("");
    setDocTypeId("rent");
  };

  const handleOpen = async (id: string) => {
    if (isLoading) return;
    try {
      const res = await fetch(`/api/user-documents/${id}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) return;
      setCurrentDocId(data.id);
      setDocTypeId(typeof data.docType === "string" ? data.docType : "other");
      setDocument(typeof data.content === "string" ? data.content : "");
      setTurns(Array.isArray(data.turns) ? data.turns : []);
      setQuestion("");
      setError("");
    } catch {
      /* 読み込み失敗は無視 */
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("この文書と会話を削除しますか？")) return;
    try {
      await fetch(`/api/user-documents/${id}`, { method: "DELETE" });
      if (currentDocId === id) handleNew();
      refreshList();
    } catch {
      /* 削除失敗は無視 */
    }
  };

  const latestDisclaimer = turns.length ? turns[turns.length - 1].disclaimer : "";

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 pt-8 pb-12 md:pb-16">
        <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
          {/* マイ文書 */}
          <aside className="order-2 lg:order-1 mt-10 lg:mt-0 w-full lg:w-[260px] lg:shrink-0">
            <div className="bg-[var(--surface)] rounded-[20px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[var(--foreground)]">マイ文書</h2>
                <button
                  onClick={handleNew}
                  className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium transition-colors duration-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新規
                </button>
              </div>
              {savedList.length === 0 ? (
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  保存した文書はここに並びます。文書を貼って質問し、「保存」すると次回そのまま続きを聞けます。
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {savedList.map((s) => {
                    const Icon = TYPE_ICONS[s.docType] ?? FileText;
                    const active = s.id === currentDocId;
                    return (
                      <li key={s.id}>
                        <div
                          className={`group flex items-start gap-2 rounded-xl px-3 py-2.5 transition-colors duration-300 ${
                            active ? "bg-[var(--soft-blue)]" : "hover:bg-[var(--pale-gray)]"
                          }`}
                        >
                          <button onClick={() => handleOpen(s.id)} className="flex-1 min-w-0 text-left">
                            <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--foreground)]">
                              <Icon className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                              <span className="truncate">{s.title}</span>
                            </span>
                            <span className="block text-[10px] text-[var(--text-light)] mt-0.5 pl-5">
                              {getDocumentType(s.docType).label}・{s.turnCount}件の質問
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            aria-label="削除"
                            className="opacity-0 group-hover:opacity-100 text-[var(--text-light)] hover:text-red-500 transition-all duration-300 shrink-0 mt-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* メイン */}
          <div className="order-1 lg:order-2 lg:flex-1 lg:min-w-0">
            <div className="mb-6 animate-fade-in-up">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-[var(--primary)]" />
                規約・契約から調べる
              </h1>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                文書を貼り付けて質問すると、AIが該当箇所を引用しながら中立に整理します。続けて質問でき、保存すれば次回そのまま続けられます。
              </p>
            </div>

            <div className="mb-6 bg-[var(--pale-gray)] px-5 py-3.5 rounded-2xl animate-fade-in-up delay-100">
              <p className="text-[12px] text-[var(--muted)] leading-relaxed">
                これは<strong>文書の記載を整理する参考情報</strong>です。最終的な可否や法的な判断ではありません。保存した文書は<strong>あなただけ</strong>が見られます。
              </p>
            </div>

            {/* 文書パネル */}
            <div className="bg-[var(--surface)] rounded-[20px] p-6 md:p-7 mb-6 animate-fade-in-up delay-200 space-y-5">
              <div>
                <label className="text-sm font-bold text-[var(--foreground)] block mb-2.5">文書の種類</label>
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
                        className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-2 transition-colors duration-300 disabled:opacity-40 ${
                          active
                            ? "bg-[var(--deep-blue)] text-white"
                            : "bg-[var(--pale-gray)] text-[var(--muted)] hover:bg-[var(--soft-blue)] hover:text-[var(--deep-blue)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-sm font-bold text-[var(--foreground)]">文書を貼り付け</label>
                  <span className={`text-[11px] tabular-nums ${docOver ? "text-red-500" : "text-[var(--text-light)]"}`}>
                    {document.length.toLocaleString()} / {MAX_DOC_CHARS.toLocaleString()}字
                  </span>
                </div>
                <textarea
                  className="w-full h-40 p-5 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] focus:border-[var(--deep-blue)] focus:bg-[var(--soft-blue)] outline-none resize-none text-[var(--foreground)] placeholder-[var(--text-light)] text-sm leading-relaxed transition-all duration-300"
                  placeholder={docType.placeholder}
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  disabled={isLoading}
                />
                {docOver && (
                  <p className="text-[11px] text-red-500 mt-1.5">
                    長いため、分析では先頭{MAX_DOC_CHARS.toLocaleString()}字のみ読み込まれます。該当しそうな部分に絞ると精度が上がります。
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {currentDocId ? (saving ? "自動保存中…" : "保存済み（質問のたびに自動保存）") : "未保存"}
                </span>
                <button
                  type="button"
                  onClick={() => saveDoc(turns, true)}
                  disabled={!document.trim() || saving}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--deep-blue)] bg-[var(--pale-gray)] hover:bg-[var(--soft-blue)] rounded-full px-4 py-2 transition-colors duration-300 disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  {currentDocId ? "更新を保存" : "この文書を保存"}
                </button>
              </div>
            </div>

            {/* 会話スレッド */}
            {(hasConversation || isLoading) && (
              <div className="space-y-6 mb-6">
                {turns.map((t, i) => (
                  <TurnView key={i} turn={t} />
                ))}

                {isLoading && (
                  <div className="space-y-4">
                    <QuestionBubble text={pendingQuestion} />
                    {pendingFindings.length > 0 ? (
                      <div className="grid gap-4">
                        {pendingFindings.map((f, idx) => (
                          <ClauseCard key={idx} finding={f} index={idx} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-muted)]">
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                        {statusMsg}
                      </div>
                    )}
                  </div>
                )}
                <div ref={threadEndRef} />
              </div>
            )}

            {/* 質問入力 */}
            <form
              onSubmit={handleAsk}
              className="bg-[var(--surface)] rounded-[20px] p-6 md:p-7 mb-10 animate-fade-in-up"
            >
              <label className="text-sm font-bold text-[var(--foreground)] block mb-2.5">
                {hasConversation ? "続けて質問する" : "聞きたいこと"}
              </label>
              <div className="flex gap-2.5">
                <input
                  ref={questionRef}
                  type="text"
                  className="flex-1 p-4 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] focus:border-[var(--deep-blue)] focus:bg-[var(--soft-blue)] outline-none text-[var(--foreground)] placeholder-[var(--text-light)] text-sm transition-all duration-300"
                  placeholder={`例: ${docType.starters[0]}`}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !document.trim() || !question.trim()}
                  className="flex items-center gap-2 bg-[var(--deep-blue)] hover:bg-[var(--deep-blue-dark)] text-white px-5 rounded-xl text-sm font-medium transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              {!hasConversation && (
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
                        className="text-xs text-[var(--text-muted)] bg-[var(--pale-gray)] hover:bg-[var(--soft-blue)] hover:text-[var(--deep-blue)] rounded-full px-3.5 py-2 transition-colors duration-300 disabled:opacity-40"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {error && <p className="text-red-500 text-sm mt-4 p-4 bg-red-50 rounded-xl">{error}</p>}
            </form>

            {hasConversation && (
              <div className="space-y-6">
                <ConsultationLinks />
                {latestDisclaimer && (
                  <div className="bg-[var(--surface)] p-6 rounded-[20px] text-[13px] text-[var(--muted)] leading-relaxed">
                    {latestDisclaimer}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
  );
}

function QuestionBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
        Q
      </span>
      <p className="flex-1 text-sm font-medium text-[var(--foreground)] bg-[var(--surface)] rounded-[20px] px-4 py-3 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <QuestionBubble text={turn.question} />

      {turn.answer && (
        <div className="bg-[var(--surface)] rounded-[20px] p-5 md:p-6">
          <h3 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
            ざっくり言うと
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-[1.9]">{turn.answer}</p>
        </div>
      )}

      {turn.findings.length > 0 ? (
        <div className="grid gap-4">
          {turn.findings.map((f, idx) => (
            <ClauseCard key={idx} finding={f} index={idx} />
          ))}
        </div>
      ) : (
        turn.notFound && (
          <div className="bg-[var(--surface)] rounded-[20px] p-6 flex items-center gap-3">
            <SearchX className="w-5 h-5 text-[var(--text-light)] shrink-0" />
            <p className="text-sm text-[var(--text-muted)]">この文書には、その質問に関する明確な記載が見当たりませんでした。</p>
          </div>
        )
      )}

      {turn.checkWith && (
        <div className="bg-[var(--soft-blue)] rounded-2xl p-4 flex items-start gap-3">
          <span className="w-8 h-8 rounded-xl bg-[var(--surface)] flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4 text-[var(--deep-blue)]" />
          </span>
          <div>
            <p className="text-xs font-bold text-[var(--foreground)]">最終確認はこちらへ</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5 leading-relaxed">{turn.checkWith}</p>
          </div>
        </div>
      )}
    </div>
  );
}
