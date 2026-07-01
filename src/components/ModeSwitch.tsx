"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, FileText } from "lucide-react";

const MODES = [
  { href: "/dashboard", label: "法律から調べる", icon: Scale },
  { href: "/documents", label: "規約・契約から調べる", icon: FileText },
];

export default function ModeSwitch() {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    MODES.findIndex((m) => pathname === m.href),
  );

  return (
    <div className="relative grid grid-cols-2 p-1 bg-[var(--pale-gray)] rounded-full w-full max-w-md">
      {/* スライドする選択ピル。このコンポーネントは永続レイアウトにあるため、
          activeIndex が変わると transform がトランジションでなめらかに動く。 */}
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-[var(--deep-blue)] transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: "calc(50% - 4px)",
          transform: activeIndex === 1 ? "translateX(100%)" : "translateX(0)",
        }}
      />
      {MODES.map((m) => {
        const active = pathname === m.href;
        const Icon = m.icon;
        return (
          <Link
            key={m.href}
            href={m.href}
            className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-colors duration-300 ${
              active ? "text-white" : "text-[var(--muted)] hover:text-[var(--deep-blue)]"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{m.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
