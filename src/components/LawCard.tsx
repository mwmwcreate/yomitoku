import { BookOpen, Info, ShieldAlert } from "lucide-react";

export type Law = {
  name: string;
  description: string;
  relevance?: string;
  relation: string;
  caution: string;
};

export default function LawCard({ law, index = 0 }: { law: Law; index?: number }) {
  return (
    <div
      className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-[var(--card-shadow-hover)] transition-all duration-500 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header */}
      <div className="px-7 py-5 border-b border-[var(--border-light)]">
        <h3 className="font-bold text-base text-[var(--foreground)] flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
          </span>
          {law.name}
          {law.relevance && (
            <span
              className={`text-[10px] tracking-wider font-bold px-2.5 py-1 rounded-full border ml-auto ${
                law.relevance.includes("高")
                  ? "bg-red-50 text-red-600 border-red-200"
                  : law.relevance.includes("中")
                  ? "bg-orange-50 text-orange-600 border-orange-200"
                  : law.relevance.includes("低")
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              関連度: {law.relevance}
            </span>
          )}
        </h3>
        <p className="text-[13px] text-[var(--text-muted)] mt-2 pl-[42px] leading-relaxed">
          {law.description}
        </p>
      </div>

      {/* Body */}
      <div className="px-7 py-6 space-y-5">
        <div>
          <h4 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[var(--primary)]" />
            状況との関係性
          </h4>
          <p className="text-sm text-[var(--foreground)] leading-[1.9] bg-[var(--primary-lighter)] rounded-xl px-5 py-4">
            {law.relation}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-[var(--text-light)] tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[var(--amber-text-light)]" />
            注意点
          </h4>
          <p className="text-sm text-[var(--amber-text)] leading-[1.9] bg-[var(--amber-bg)] rounded-xl px-5 py-4">
            {law.caution}
          </p>
        </div>
      </div>
    </div>
  );
}
