import Header from "@/components/Header";
import DisclaimerAlert from "@/components/DisclaimerAlert";
import ModeEntry from "@/components/ModeEntry";
import StartButton from "@/components/StartButton";
import { PenLine, Quote, Compass } from "lucide-react";

const FEATURES = [
  {
    icon: PenLine,
    bg: "var(--soft-blue)",
    title: "そのまま貼る・書くだけ",
    desc: "契約書や利用規約、気になる状況を、むずかしい言葉のまま入力すればOK。整った文章にする必要はありません。",
  },
  {
    icon: Quote,
    bg: "var(--pale-gray)",
    title: "大事なところを、引用して案内",
    desc: "どこを見れば判断できるのか。関係する条文や規約の該当箇所を、原文を示しながらやさしく整理します。",
  },
  {
    icon: Compass,
    bg: "var(--surface)",
    title: "決めつけず、考える材料をそろえる",
    desc: "「違法か合法か」を断定はしません。あなたが自分で判断するための手がかりを、落ち着いて並べます。",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <Header />

      <main className="max-w-5xl mx-auto px-6 md:px-10">
        {/* Hero */}
        <section className="pt-8 md:pt-12 pb-14 md:pb-20">
          <div className="bg-[var(--soft-blue)] rounded-[28px] px-8 md:px-14 py-14 md:py-20">
            <p className="text-sm font-medium text-[var(--deep-blue)] mb-5">むずかしい文章を、かみ砕く相談相手</p>
            <h1 className="text-3xl md:text-5xl font-bold leading-[1.35] text-[var(--text)] max-w-2xl">
              法律も、契約も、規約も。
              <br />
              <span className="text-[var(--deep-blue)]">やさしく読み解く</span>。
            </h1>
            <p className="mt-6 text-base md:text-lg text-[var(--muted)] max-w-xl leading-relaxed">
              「これって大丈夫？」という疑問も、読むのが大変な契約書や規約も。
              どこが大事かを、AIが根拠とともに整理します。
            </p>
            <StartButton />
          </div>
        </section>

        {/* Features */}
        <section className="pb-14 md:pb-20">
          <div className="space-y-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-[24px] px-7 md:px-10 py-8 md:py-9 flex items-start gap-5 animate-fade-in-up"
                  style={{ backgroundColor: f.bg, animationDelay: `${i * 0.08}s` }}
                >
                  <span className="w-11 h-11 rounded-2xl bg-[var(--surface)] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[var(--deep-blue)]" strokeWidth={2} />
                  </span>
                  <div className="pt-0.5">
                    <h3 className="font-bold text-lg text-[var(--text)] mb-1.5">{f.title}</h3>
                    <p className="text-sm md:text-[15px] text-[var(--muted)] leading-relaxed max-w-2xl">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 入口: ジャンルで分ける */}
        <section id="start" className="pb-14 md:pb-20 scroll-mt-20">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-[var(--text)]">どちらから調べますか？</h2>
            <p className="text-sm text-[var(--muted)] mt-2">
              選ぶと、そのジャンルに合わせた画面に進みます（初回はログインします）。
            </p>
          </div>
          <ModeEntry />
        </section>

        {/* 免責 */}
        <section className="pb-24 md:pb-32 max-w-3xl">
          <DisclaimerAlert />
        </section>
      </main>

      <footer className="w-full py-10 text-center text-[var(--muted-light)] text-xs">
        <p>&copy; 2026 yomitoku</p>
      </footer>
    </div>
  );
}
