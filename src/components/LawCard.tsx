import { BookOpen, Info, ShieldAlert } from "lucide-react";

export type Law = {
  name: string;
  description: string;
  relevance?: string;
  relation: string;
  caution: string;
};

function relevancePill(relevance: string) {
  if (relevance.includes("高")) return "bg-[var(--deep-blue)] text-white";
  if (relevance.includes("中")) return "bg-[var(--soft-blue)] text-[var(--deep-blue)]";
  return "bg-[var(--pale-gray)] text-[var(--muted)]";
}

export default function LawCard({ law, index = 0 }: { law: Law; index?: number }) {
  return (
    <div
      className="bg-[var(--surface)] rounded-[20px] p-7 md:p-8 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-[var(--soft-blue)] flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-[var(--deep-blue)]" />
        </span>
        <h3 className="font-bold text-base text-[var(--text)] flex-1">{law.name}</h3>
        {law.relevance && (
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 ${relevancePill(law.relevance)}`}>
            関連度 {law.relevance}
          </span>
        )}
      </div>
      <p className="text-[13px] text-[var(--muted)] mt-2.5 pl-[46px] leading-relaxed">{law.description}</p>

      <div className="mt-6 space-y-3">
        <div className="bg-[var(--soft-blue)] rounded-2xl px-5 py-4">
          <h4 className="text-xs font-bold text-[var(--deep-blue)] mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            状況との関係性
          </h4>
          <p className="text-sm text-[var(--text)] leading-[1.9]">{law.relation}</p>
        </div>
        <div className="bg-[var(--pale-gray)] rounded-2xl px-5 py-4">
          <h4 className="text-xs font-bold text-[var(--muted)] mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            気をつけたい点
          </h4>
          <p className="text-sm text-[var(--text)] leading-[1.9]">{law.caution}</p>
        </div>
      </div>
    </div>
  );
}
