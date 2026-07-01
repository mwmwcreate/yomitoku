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

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-[var(--pale-gray)] rounded-full">
      {MODES.map((m) => {
        const active = pathname === m.href;
        const Icon = m.icon;
        return (
          <Link
            key={m.href}
            href={m.href}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors duration-300 ${
              active
                ? "bg-[var(--deep-blue)] text-white"
                : "text-[var(--muted)] hover:text-[var(--deep-blue)]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {m.label}
          </Link>
        );
      })}
    </div>
  );
}
