"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

type RankingTopic = {
  id: string;
  label: string;
  icon: string;
  count: number;
  rank: number;
  summaries: string[];
};

type Status = "loading" | "ready" | "error";

export default function TopicRanking({
  refreshKey = 0,
  className = "",
}: {
  refreshKey?: number;
  className?: string;
}) {
  const [topics, setTopics] = useState<RankingTopic[]>([]);
  const [minVisible, setMinVisible] = useState(3);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch("/api/rankings", { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) throw new Error("failed");
        setTopics(Array.isArray(data.topics) ? data.topics : []);
        if (typeof data.minVisible === "number") setMinVisible(data.minVisible);
        setStatus("ready");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [refreshKey]);

  return (
    <aside className={`bg-white rounded-2xl border border-[var(--border)] p-5 md:p-6 ${className}`}>
      <div className="flex items-center gap-2.5 mb-5">
        <span className="w-9 h-9 rounded-xl bg-[var(--primary-light)] flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">みんなの相談テーマ</h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">よく相談される分野と例</p>
        </div>
      </div>

      {status === "loading" && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-2/3 rounded bg-[var(--border-light)] animate-pulse" />
              <div className="h-3 w-full rounded bg-[var(--border-light)] animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-[var(--border-light)] animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="text-xs text-[var(--text-muted)] py-3">ランキングを読み込めませんでした。</p>
      )}

      {status === "ready" && topics.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] py-3 leading-relaxed">
          まだ集計できる相談がありません。分析が増えると表示されます。
        </p>
      )}

      {status === "ready" && topics.length > 0 && (
        <div className="space-y-5">
          {topics.map((t, i) => (
            <div key={t.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base shrink-0">{t.icon}</span>
                <h3 className={`text-sm text-[var(--foreground)] flex-1 truncate ${i === 0 ? "font-bold" : "font-medium"}`}>
                  {t.label}
                </h3>
                <span className="text-[11px] text-[var(--text-muted)] tabular-nums shrink-0">{t.count}件</span>
              </div>
              {t.summaries.length > 0 ? (
                <ul className="space-y-1.5 pl-1">
                  {t.summaries.map((s, idx) => (
                    <li key={idx} className="text-xs text-[var(--text-muted)] flex items-start gap-1.5 leading-relaxed">
                      <span className="text-[var(--text-light)] shrink-0 mt-0.5">・</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[var(--text-light)] pl-1 leading-relaxed">
                  件数が少ないため内容は非表示（{minVisible}件未満）
                </p>
              )}
            </div>
          ))}
          <p className="text-[10px] text-[var(--text-light)] pt-3 border-t border-[var(--border-light)] leading-relaxed">
            相談例はAIが要約・匿名化したものです（実際の入力文そのものではありません）。
          </p>
        </div>
      )}
    </aside>
  );
}
