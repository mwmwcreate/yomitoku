import { AlertTriangle } from "lucide-react";

export default function DisclaimerAlert() {
  return (
    <div className="bg-[var(--amber-bg)] border border-[var(--amber-border)]/30 px-6 py-5 rounded-2xl">
      <div className="flex gap-4">
        <AlertTriangle className="text-[var(--amber-text-light)] shrink-0 w-5 h-5 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-[var(--amber-text)] mb-2">
            免責事項
          </h3>
          <div className="text-[13px] text-[var(--amber-text-light)] space-y-2 leading-relaxed">
            <p>
              本アプリは、
              <strong>学習および注意喚起を目的とした参考情報の提供</strong>
              のみを行います。
              入力された状況が「違法」か「合法」かを判断するものではありません。
            </p>
            <p>
              AIによる分析結果は必ずしも正確とは限らず、法的な助言として利用することはできません。
              実際の法的な問題については、必ず弁護士などの専門家にご相談ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
