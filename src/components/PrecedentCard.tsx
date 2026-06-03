import { Gavel, ExternalLink, GitCompare } from "lucide-react";

export type Precedent = {
  title: string;
  court?: string;
  date?: string;
  summary: string;
  relation?: string;
  url: string;
};

export default function PrecedentCard({ precedent, index = 0 }: { precedent: Precedent; index?: number }) {
  return (
    <div
      className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-[var(--card-shadow-hover)] transition-all duration-500 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="px-7 py-5 border-b border-[var(--border-light)]">
        <h3 className="font-bold text-base text-[var(--foreground)] flex items-start gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center shrink-0 mt-0.5">
            <Gavel className="w-4 h-4 text-[var(--primary)]" />
          </span>
          <span className="leading-snug">{precedent.title}</span>
        </h3>
        {(precedent.court || precedent.date) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pl-[42px] text-xs text-[var(--text-muted)]">
            {precedent.court && <span>{precedent.court}</span>}
            {precedent.date && <span>{precedent.date}</span>}
          </div>
        )}
      </div>

      <div className="px-7 py-6 space-y-5">
        <div>
          <h4 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5">
            事案の概要
          </h4>
          <p className="text-sm text-[var(--foreground)] leading-[1.9] bg-[var(--primary-lighter)] rounded-xl px-5 py-4">
            {precedent.summary}
          </p>
        </div>

        {precedent.relation && (
          <div>
            <h4 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-[var(--primary)]" />
              今回の状況との関係
            </h4>
            <p className="text-sm text-[var(--foreground)] leading-[1.9] px-5 py-4 bg-[var(--primary-lighter)] rounded-xl">
              {precedent.relation}
            </p>
          </div>
        )}

        <a
          href={precedent.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium transition-colors duration-300"
        >
          出典を確認する
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
