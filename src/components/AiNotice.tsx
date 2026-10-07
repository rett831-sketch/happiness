import type { KeyProblem } from "@/lib/ai";

/**
 * A quiet line under built-in content: invites visitors without a key to add one,
 * or explains why their key didn't work this time.
 */
export default function AiNotice({
  keyProblem,
  night = false,
  onOpenSettings,
}: {
  keyProblem?: KeyProblem;
  night?: boolean;
  onOpenSettings: () => void;
}) {
  const text =
    keyProblem === "invalid"
      ? "你的金鑰無法使用，可能輸入錯誤或已失效。這次先用內建的內容。"
      : keyProblem === "quota"
        ? "你的 AI 帳號額度不足或請求太頻繁。這次先用內建的內容。"
        : "這是內建的內容。設定自己的 AI 金鑰，就能收到為你寫的專屬內容。";
  const action = keyProblem ? "檢查金鑰" : "設定金鑰";

  return (
    <p
      className={`mx-auto max-w-sm text-center font-sans text-xs font-light leading-relaxed ${
        keyProblem ? (night ? "text-dew" : "text-seal") : night ? "text-moon/55" : "text-ink-soft"
      }`}
    >
      {text}{" "}
      <button
        type="button"
        onClick={onOpenSettings}
        className={`border-b pb-px tracking-[0.15em] ${night ? "border-moon/40 text-moon/85" : "border-ink/30 text-ink"}`}
      >
        {action}
      </button>
    </p>
  );
}
