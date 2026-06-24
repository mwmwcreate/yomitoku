import { Quote, FileText, Info } from "lucide-react";

export type Finding = {
  quote: string;
  location?: string;
  explanation: string;
};

export default function ClauseCard({ finding, index = 0 }: { finding: Finding; index?: number }) {
  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden border-l-[5px] border-l-[var(--primary)] border-y border-r border-[var(--border)] hover:shadow-[var(--card-shadow-hover)] transition-all duration-500 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header: 該当条項（原文引用） */}
      <div className="px-7 py-5 border-b border-[var(--border-light)] bg-[var(--primary-lighter)]">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-[var(--primary)]" />
          </span>
          <h3 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase">
            文書の該当箇所
          </h3>
          {finding.location && (
            <span className="ml-auto text-[11px] font-bold text-[var(--primary)] bg-[var(--primary-light)] rounded-full px-2.5 py-1">
              {finding.location}
            </span>
          )}
        </div>
        <blockquote className="relative mt-3 pl-7 text-sm text-[var(--foreground)] leading-[1.9]">
          <Quote className="absolute left-0 top-0.5 w-4 h-4 text-[var(--primary)]/40" strokeWidth={2.5} />
          {finding.quote}
        </blockquote>
      </div>

      {/* Body: 読み方（中立・非断定） */}
      <div className="px-7 py-6">
        <h4 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[var(--primary)]" />
          この箇所の読み方
        </h4>
        <p className="text-sm text-[var(--foreground)] leading-[1.9]">{finding.explanation}</p>
      </div>
    </div>
  );
}
