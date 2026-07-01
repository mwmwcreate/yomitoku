"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogIn, LogOut, History } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link
          href={session ? "/dashboard" : "/"}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity duration-300"
        >
          <span className="w-7 h-7 rounded-lg bg-[var(--deep-blue)] flex items-center justify-center">
            <span className="text-white text-sm font-bold lowercase">y</span>
          </span>
          <span className="font-bold text-lg tracking-wide lowercase text-[var(--deep-blue)]">yomitoku</span>
        </Link>

        <nav className="flex items-center gap-2">
          {status === "loading" ? (
            <div className="h-9 w-24 bg-[var(--pale-gray)] rounded-full animate-pulse" />
          ) : session ? (
            <>
              <Link
                href="/history"
                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--deep-blue)] hover:bg-[var(--pale-gray)] flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-colors duration-300"
              >
                <History className="w-4 h-4" />
                履歴
              </Link>
              <span className="text-sm text-[var(--text)] max-w-[120px] truncate px-1">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label="ログアウト"
                className="text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--pale-gray)] p-2 rounded-full transition-colors duration-300"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
              className="flex items-center gap-2 bg-[var(--deep-blue)] hover:bg-[var(--deep-blue-dark)] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-300"
            >
              <LogIn className="w-4 h-4" />
              ログイン
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
