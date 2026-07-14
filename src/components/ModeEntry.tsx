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
    bg: "var(--soft-blue)",
    bgHover: "var(--soft-blue-hover)",
  },
  {
    href: "/documents",
    icon: FileText,
    title: "規約・契約から調べる",
    desc: "賃貸契約・就業規則・利用規約などを貼り付けて、該当箇所を引用しながら中立に整理する。",
    bg: "var(--pale-gray)",
    bgHover: "var(--pale-gray-hover)",
  },
];

export default function ModeEntry() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const go = (href: string) => {
    if (session) router.push(href);
    else signIn(undefined, { callbackUrl: href });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {MODES.map((m, i) => {
        const Icon = m.icon;
        return (
          <button
            key={m.href}
            onClick={() => go(m.href)}
            disabled={status === "loading"}
            className="group text-left rounded-[24px] px-8 py-9 transition-colors duration-300 animate-fade-in-up disabled:opacity-60"
            style={{ backgroundColor: m.bg, animationDelay: `${0.1 + i * 0.08}s` }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = m.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = m.bg)}
          >
            <span className="w-12 h-12 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-6">
              <Icon className="w-6 h-6 text-[var(--deep-blue)]" strokeWidth={2} />
            </span>
            <h3 className="font-bold text-xl text-[var(--deep-blue)] mb-2 flex items-center gap-2">
              {m.title}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">{m.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
