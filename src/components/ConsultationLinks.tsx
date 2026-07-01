import { LifeBuoy, Phone, ExternalLink } from "lucide-react";

type Resource = {
  name: string;
  desc: string;
  contact: string;
  href: string;
};

// 公的・中立な相談窓口のみ。特定の事業者への誘導や勧誘は行わない（学習・注意喚起の建付けに合わせる）。
const RESOURCES: Resource[] = [
  {
    name: "法テラス（日本司法支援センター）",
    desc: "国が設立した法律相談の総合案内。無料相談や弁護士費用の立替え制度の案内も。",
    contact: "0570-078374",
    href: "https://www.houterasu.or.jp/",
  },
  {
    name: "消費生活センター（消費者ホットライン）",
    desc: "契約・買い物・悪質商法など消費者トラブルの相談。",
    contact: "188（いやや！）",
    href: "https://www.kokusen.go.jp/map/",
  },
  {
    name: "警察相談専用窓口",
    desc: "事件・事故にあたるか迷うトラブル、ストーカー・嫌がらせなどの相談。",
    contact: "#9110",
    href: "https://www.npa.go.jp/bureau/safetylife/seian/9110.html",
  },
  {
    name: "みんなの人権110番（法務局）",
    desc: "差別・いじめ・プライバシー侵害など人権に関わる相談。",
    contact: "0570-003-110",
    href: "https://www.moj.go.jp/JINKEN/jinken20.html",
  },
];

export default function ConsultationLinks() {
  return (
    <section className="bg-[var(--surface)] rounded-[20px] p-6 md:p-7 animate-fade-in-up">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="w-9 h-9 rounded-xl bg-[var(--soft-blue)] flex items-center justify-center shrink-0">
          <LifeBuoy className="w-4 h-4 text-[var(--deep-blue)]" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-[var(--text)]">困っているときの相談先</h3>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">公的な無料・低額の相談窓口です</p>
        </div>
      </div>

      <ul className="grid sm:grid-cols-2 gap-3">
        {RESOURCES.map((r) => (
          <li key={r.name}>
            <a
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full rounded-2xl bg-[var(--pale-gray)] hover:bg-[var(--pale-gray-hover)] p-4 transition-colors duration-300"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-[var(--text)] leading-snug">{r.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--muted-light)] shrink-0 mt-0.5 group-hover:text-[var(--deep-blue)] transition-colors duration-300" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">{r.desc}</p>
              <p className="text-xs font-medium text-[var(--deep-blue)] mt-2 flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                {r.contact}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
