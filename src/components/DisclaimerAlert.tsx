export default function DisclaimerAlert() {
  return (
    <div className="bg-[var(--pale-gray)] rounded-[20px] px-7 py-6">
      <h3 className="text-sm font-bold text-[var(--text)] mb-2">これは法律相談ではありません</h3>
      <div className="text-[13px] text-[var(--muted)] space-y-2 leading-relaxed">
        <p>
          yomitoku は、法律や契約・規約の内容を
          <span className="text-[var(--deep-blue)] font-medium">わかりやすく整理してお手伝いする</span>
          ためのものです。違法か合法か、OKかダメかを判断するものではありません。
        </p>
        <p>
          AIによる整理は必ずしも正確とは限りません。大切な判断のときは、弁護士などの専門家や、契約の相手にあわせて確認してください。
        </p>
      </div>
    </div>
  );
}
