"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

// ランディングの主CTA。押したら——
//  - 未ログイン: Discordログイン → 完了後に /dashboard（質問ページ）へ
//  - ログイン済み: そのまま /dashboard へ
export default function StartButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleClick = () => {
    if (session) router.push("/dashboard");
    else signIn(undefined, { callbackUrl: "/dashboard" });
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      className="inline-flex items-center gap-2 mt-9 bg-[var(--deep-blue)] hover:bg-[var(--deep-blue-dark)] text-white px-7 py-3.5 rounded-full text-sm font-medium transition-colors duration-300 disabled:opacity-60"
    >
      {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
      さっそく使ってみる
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
