import Header from "@/components/Header";
import ModeSwitch from "@/components/ModeSwitch";

// dashboard と documents で共有する永続レイアウト。
// ここに置いた Header と ModeSwitch はモード切り替えでも再マウントされないため、
// トグルは位置が固定されたまま（選択ピルだけがCSSでスライド）、中身だけが遷移する。
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-8 flex justify-center">
        <ModeSwitch />
      </div>
      {children}
    </div>
  );
}
