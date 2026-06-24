"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogIn, LogOut, Scale, History } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-lg border-b border-[var(--border-light)]">
      <div className="max-w-5xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link
          href={session ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 text-[var(--primary)] hover:opacity-70 transition-opacity duration-300"
        >
          <Scale className="h-5 w-5" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-wide lowercase">yomitoku</span>
        </Link>

        <nav className="flex items-center gap-6">
          {status === "loading" ? (
            <div className="h-8 w-20 bg-[var(--border-light)] rounded-full animate-pulse" />
          ) : session ? (
            <>
              <Link
                href="/history"
                className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1.5 transition-colors duration-300"
              >
                <History className="w-4 h-4" />
                履歴
              </Link>
              <div className="flex items-center gap-4 pl-6 border-l border-[var(--border)]">
                <span className="text-sm text-[var(--foreground)] max-w-[120px] truncate">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors duration-300"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
              className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#5865F2]/20 active:scale-[0.97]"
            >
              <LogIn className="w-4 h-4" />
              Discordでログイン
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
