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
      className="bg-slate-900 text-slate-100 rounded-2xl overflow-hidden ring-1 ring-slate-800 shadow-xl shadow-slate-900/30 hover:ring-slate-700 hover:shadow-2xl hover:shadow-slate-900/40 transition-all duration-500 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header */}
      <div className="px-7 py-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-900/95">
        <h3 className="font-bold text-base text-white flex items-start gap-2.5 leading-snug">
          <span className="w-8 h-8 rounded-lg bg-[var(--primary)]/90 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-[var(--primary)]/30">
            <Gavel className="w-4 h-4 text-white" />
          </span>
          <span>{precedent.title}</span>
        </h3>
        {(precedent.court || precedent.date) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 pl-[42px] text-xs">
            {precedent.court && (
              <span className="text-slate-300">{precedent.court}</span>
            )}
            {precedent.court && precedent.date && (
              <span className="text-slate-600">・</span>
            )}
            {precedent.date && (
              <span className="text-slate-400 font-mono tracking-tight">{precedent.date}</span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-7 py-6 space-y-5">
        <div>
          <h4 className="text-[11px] font-bold text-blue-300/90 tracking-[0.2em] uppercase mb-2.5">
            事案の概要
          </h4>
          <p className="text-sm text-slate-100 leading-[1.95] bg-slate-800/60 rounded-xl px-5 py-4 ring-1 ring-slate-700/40">
            {precedent.summary}
          </p>
        </div>

        {precedent.relation && (
          <div>
            <h4 className="text-[11px] font-bold text-blue-300/90 tracking-[0.2em] uppercase mb-2.5 flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-blue-300" />
              今回の状況との関係
            </h4>
            <p className="text-sm text-slate-100 leading-[1.95] bg-slate-800/60 rounded-xl px-5 py-4 ring-1 ring-slate-700/40">
              {precedent.relation}
            </p>
          </div>
        )}

        <a
          href={precedent.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-300 hover:text-blue-200 font-medium transition-colors duration-300 group"
        >
          出典を確認する
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
        </a>
      </div>
    </div>
  );
}
