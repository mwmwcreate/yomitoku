import Header from "@/components/Header";
import DisclaimerAlert from "@/components/DisclaimerAlert";
import ModeEntry from "@/components/ModeEntry";
import { Scale, Search, BookOpenCheck, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[var(--foreground)]">
      <Header />

      <main className="max-w-4xl mx-auto px-6 md:px-10">

        {/* Hero Section */}
        <section className="pt-24 pb-20 md:pt-32 md:pb-28 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary-light)] rounded-2xl mb-8">
              <Scale className="w-7 h-7 text-[var(--primary)]" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight animate-fade-in-up delay-100">
            法律も、契約も、規約も。
            <br />
            <span className="text-[var(--primary)]">やさしく読み解く</span>。
          </h1>

          <p className="mt-6 text-base md:text-lg text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            「これって大丈夫？」という日常の疑問も、
            <br className="md:hidden" />
            わかりにくい契約書や利用規約も、
            <br />
            AIが関係する根拠とともに整理します。
          </p>
        </section>

        {/* Features Section */}
        <section className="pb-20 md:pb-28">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Search,
                color: "var(--primary)",
                bg: "var(--primary-light)",
                title: "状況を入力するだけ",
                desc: "あなたの状況を自由な言葉で入力するだけで、AIが文脈を読み取ります。",
              },
              {
                icon: BookOpenCheck,
                color: "var(--primary)",
                bg: "var(--primary-light)",
                title: "関連法律をリストアップ",
                desc: "関係する可能性のある法律とその理由を、わかりやすく提示します。",
              },
              {
                icon: ShieldCheck,
                color: "#059669",
                bg: "#ecfdf5",
                title: "学習・注意喚起として",
                desc: "知らなかった法律のリスクに気づくための第一歩として活用できます。",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl border border-[var(--border)] hover:shadow-[var(--card-shadow-hover)] transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: feature.bg }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                </div>
                <h3 className="font-bold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 入口: ジャンルで分ける */}
        <section className="pb-16 md:pb-20">
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="text-xl font-bold">どちらから調べますか？</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              選ぶと、そのジャンルに最適化された画面に進みます（初回はDiscordログイン）。
            </p>
          </div>
          <ModeEntry />
        </section>

        {/* Disclaimer */}
        <section className="pb-24 md:pb-32 max-w-2xl mx-auto">
          <div className="animate-fade-in-up delay-600">
            <DisclaimerAlert />
          </div>
        </section>
      </main>

      <footer className="w-full py-10 text-center text-[var(--text-light)] text-xs border-t border-[var(--border-light)]">
        <p>&copy; 2026 yomitoku</p>
      </footer>
    </div>
  );
}
