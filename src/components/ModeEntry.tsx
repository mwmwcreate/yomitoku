"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Scale, FileText, ArrowRight } from "lucide-react";

const MODES = [
  {
    href: "/dashboard",
    icon: Scale,
    title: "法律から調べる",
    desc: "「これって大丈夫？」という日常の疑問から、関係しそうな法律と実在の判例を調べる。",
    accent: "var(--primary)",
    bg: "var(--primary-light)",
  },
  {
    href: "/documents",
    icon: FileText,
    title: "規約・契約から調べる",
    desc: "賃貸契約・就業規則・利用規約などを貼り付けて、該当箇所を引用しながら中立に整理する。",
    accent: "#059669",
    bg: "#ecfdf5",
  },
];

export default function ModeEntry() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const go = (href: string) => {
    if (session) router.push(href);
    else signIn("discord", { callbackUrl: href });
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {MODES.map((m, i) => {
        const Icon = m.icon;
        return (
          <button
            key={m.href}
            onClick={() => go(m.href)}
            disabled={status === "loading"}
            className="group text-left bg-white p-7 md:p-8 rounded-2xl border border-[var(--border)] hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-0.5 transition-all duration-500 animate-fade-in-up disabled:opacity-60"
            style={{ animationDelay: `${0.3 + i * 0.1}s` }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: m.bg }}
            >
              <Icon className="w-6 h-6" style={{ color: m.accent }} />
            </div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-1.5">
              {m.title}
              <ArrowRight className="w-4 h-4 text-[var(--text-light)] group-hover:translate-x-1 group-hover:text-[var(--primary)] transition-all duration-300" />
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{m.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
