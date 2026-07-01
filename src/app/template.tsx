"use client";

// template.tsx はナビゲーションのたびに再マウントされるため、
// ルート切り替え時に毎回フェード＋わずかなスライドの遷移が入る。
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
