"use client";

// (app) グループ内のページ本体だけを包む template。
// レイアウト（Header・ModeSwitch）は永続、この中身だけがモード切り替えのたびに
// 再マウントされて、フェード＋スライドの遷移が再生される。
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
