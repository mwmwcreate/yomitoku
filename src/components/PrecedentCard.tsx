import { Gavel, ExternalLink, GitCompare, Quote } from "lucide-react";

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
      className="relative bg-white rounded-2xl overflow-hidden border-l-[5px] border-l-[var(--primary)] border-y border-r border-[var(--border)] hover:shadow-[var(--card-shadow-hover)] transition-all duration-500 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Decorative quote mark - signals this is "cited content" */}
      <Quote className="absolute top-4 right-5 w-6 h-6 text-[#d8c89a]/50" strokeWidth={2.5} />

      {/* Header */}
      <div className="px-7 py-5 border-b border-[var(--border-light)] bg-[#fdfaf2]">
        <h3 className="font-bold text-base text-[var(--foreground)] flex items-start gap-2.5 pr-8">
          <span className="w-8 h-8 rounded-lg bg-[#f5ecd9] flex items-center justify-center shrink-0 mt-0.5">
            <Gavel className="w-4 h-4 text-[#8b6f30]" />
          </span>
          <span className="leading-snug">{precedent.title}</span>
        </h3>
        {(precedent.court || precedent.date) && (
          <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-2 pl-[42px] text-xs text-[#8b6f30]/80">
            {precedent.court && <span>{precedent.court}</span>}
            {precedent.court && precedent.date && <span className="text-[#8b6f30]/40">・</span>}
            {precedent.date && <span className="font-mono tracking-tight">{precedent.date}</span>}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-7 py-6 space-y-5">
        <div>
          <h4 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5">
            事案の概要
          </h4>
          <p className="text-sm text-[var(--foreground)] leading-[1.95]">
            {precedent.summary}
          </p>
        </div>

        {precedent.relation && (
          <div className="pt-1">
            <h4 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-[var(--primary)]" />
              今回の状況との関係
            </h4>
            <p className="text-sm text-[var(--foreground)] leading-[1.95] bg-[var(--primary-lighter)] rounded-xl px-5 py-4">
              {precedent.relation}
            </p>
          </div>
        )}

        <a
          href={precedent.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium transition-colors duration-300 group"
        >
          出典を確認する
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
        </a>
      </div>
    </div>
  );
}
