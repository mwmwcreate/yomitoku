"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Gavel, MessageCircleQuestion, PencilLine } from "lucide-react";
import LawCard, { Law } from "./LawCard";
import PrecedentCard, { Precedent } from "./PrecedentCard";

type Answer = {
  summary: string;
  laws: Law[];
  precedents: Precedent[];
  disclaimer: string;
};

type Status = "loading" | "ready" | "error";

export default function TopicAnswerModal({
  analysisId,
  title,
  onClose,
  onUse,
}: {
  analysisId: string;
  title: string;
  onClose: () => void;
  onUse?: () => void;
}) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch(`/api/analyses/${analysisId}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) throw new Error("failed");
        setAnswer(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [analysisId]);

  // Escapeで閉じる + 背景スクロールを固定
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // sticky なサイドバー内で描画するとスタッキングコンテキストに閉じ込められ
  // ページ内容がモーダルに被るため、ポータルで body 直下に出す。
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="相談例の回答"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-[var(--background)] w-full max-w-3xl max-h-[85vh] rounded-[24px] overflow-hidden flex flex-col animate-fade-in-up">
        <div className="flex items-start gap-3 px-6 md:px-8 py-5 bg-[var(--surface)] shrink-0">
          <span className="w-9 h-9 rounded-xl bg-[var(--soft-blue)] flex items-center justify-center shrink-0 mt-0.5">
            <MessageCircleQuestion className="w-4 h-4 text-[var(--deep-blue)]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[var(--text-muted)]">みんなの相談テーマ — AIの回答例</p>
            <h2 className="text-sm font-bold text-[var(--foreground)] mt-0.5 leading-relaxed">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--pale-gray)] transition-colors duration-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 md:px-8 py-6 space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
              <p className="mt-4 text-sm text-[var(--text-muted)]">回答を読み込んでいます...</p>
            </div>
          )}

          {status === "error" && (
            <p className="text-sm text-[var(--text-muted)] py-10 text-center">
              回答を読み込めませんでした。時間をおいて再度お試しください。
            </p>
          )}

          {status === "ready" && answer && (
            <>
              <section>
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">
                  関連する可能性のある法律
                </h3>
                {answer.laws.length > 0 ? (
                  <div className="grid gap-4">
                    {answer.laws.map((law, idx) => (
                      <LawCard key={idx} law={law} index={idx} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    関連法律の情報がありません。
                  </p>
                )}
              </section>

              {answer.precedents.length > 0 && (
                <section className="px-5 md:px-6 py-6 bg-[var(--pale-gray)] rounded-[24px]">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center">
                      <Gavel className="w-4 h-4 text-[var(--deep-blue)]" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text)]">類似する過去の判例</h3>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">Web検索で取得した実在の裁判例(出典URL付き)</p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {answer.precedents.map((p, idx) => (
                      <PrecedentCard key={idx} precedent={p} index={idx} />
                    ))}
                  </div>
                </section>
              )}

              {answer.disclaimer && (
                <p className="bg-[var(--pale-gray)] p-5 rounded-2xl text-[12px] text-[var(--muted)] leading-relaxed">
                  {answer.disclaimer}
                </p>
              )}
            </>
          )}
        </div>

        {onUse && (
          <div className="px-6 md:px-8 py-4 bg-[var(--surface)] shrink-0">
            <button
              onClick={onUse}
              className="w-full flex items-center justify-center gap-2 bg-[var(--deep-blue)] hover:bg-[var(--deep-blue-dark)] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 active:scale-[0.98]"
            >
              <PencilLine className="w-4 h-4" />
              この相談を自分でも調べてみる
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
