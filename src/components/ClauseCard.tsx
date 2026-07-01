import { Quote, FileText, Info } from "lucide-react";

export type Finding = {
  quote: string;
  location?: string;
  explanation: string;
};

export default function ClauseCard({ finding, index = 0 }: { finding: Finding; index?: number }) {
  return (
    <div
      className="bg-[var(--surface)] rounded-[20px] p-6 md:p-7 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-[var(--soft-blue)] flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-[var(--deep-blue)]" />
        </span>
        <h3 className="text-xs font-bold text-[var(--muted)]">文書の該当箇所</h3>
        {finding.location && (
          <span className="ml-auto text-[11px] font-bold text-[var(--deep-blue)] bg-[var(--soft-blue)] rounded-full px-3 py-1">
            {finding.location}
          </span>
        )}
      </div>

      <div className="mt-4 bg-[var(--pale-blue)] rounded-2xl px-5 py-4">
        <blockquote className="relative pl-6 text-sm text-[var(--text)] leading-[1.9]">
          <Quote className="absolute left-0 top-1 w-3.5 h-3.5 text-[var(--deep-blue)]" strokeWidth={2.5} />
          {finding.quote}
        </blockquote>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-bold text-[var(--muted)] mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[var(--deep-blue)]" />
          この箇所の読み方
        </h4>
        <p className="text-sm text-[var(--text)] leading-[1.9]">{finding.explanation}</p>
      </div>
    </div>
  );
}
