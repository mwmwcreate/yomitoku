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
      className="bg-[var(--surface)] rounded-[20px] p-7 md:p-8 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-start gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-[var(--soft-blue)] flex items-center justify-center shrink-0 mt-0.5">
          <Gavel className="w-4 h-4 text-[var(--deep-blue)]" />
        </span>
        <div className="flex-1">
          <h3 className="font-bold text-base text-[var(--text)] leading-snug">{precedent.title}</h3>
          {(precedent.court || precedent.date) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-[var(--muted)]">
              {precedent.court && <span>{precedent.court}</span>}
              {precedent.court && precedent.date && <span className="text-[var(--muted-light)]">・</span>}
              {precedent.date && <span>{precedent.date}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-sm text-[var(--text)] leading-[1.95]">{precedent.summary}</p>

        {precedent.relation && (
          <div className="bg-[var(--soft-blue)] rounded-2xl px-5 py-4">
            <h4 className="text-xs font-bold text-[var(--deep-blue)] mb-2 flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5" />
              今回の状況との関係
            </h4>
            <p className="text-sm text-[var(--text)] leading-[1.95]">{precedent.relation}</p>
          </div>
        )}

        <a
          href={precedent.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--deep-blue)] hover:text-[var(--deep-blue-dark)] font-medium transition-colors duration-300 group"
        >
          出典を確認する
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
        </a>
      </div>
    </div>
  );
}
