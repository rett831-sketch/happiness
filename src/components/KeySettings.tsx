"use client";

import { useEffect, useState } from "react";
import { clearApiKey, detectProvider, getApiKey, maskKey, PROVIDER_NAMES, setApiKey } from "@/lib/apiKey";

/** Panel for entering, replacing or removing the visitor's own AI key (BYOK). */
export default function KeySettings({ onClose, onChange }: { onClose: () => void; onChange: () => void }) {
  const [current, setCurrent] = useState(getApiKey);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const currentProvider = current ? detectProvider(current) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function saveKey(e: React.FormEvent) {
    e.preventDefault();
    const key = input.trim();
    if (!detectProvider(key)) {
      setError("這看起來不像 API 金鑰。OpenAI 的金鑰以 sk- 開頭，Claude 的以 sk-ant- 開頭。");
      return;
    }
    setApiKey(key);
    setCurrent(key);
    setInput("");
    setError(null);
    onChange();
  }

  function removeKey() {
    clearApiKey();
    setCurrent(null);
    onChange();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="key-settings-title"
        className="max-h-[90vh] w-full max-w-sm animate-rise overflow-y-auto rounded-[1.5rem] bg-paper p-6 text-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between">
          <h2 id="key-settings-title" className="text-xl tracking-[0.2em]">
            AI 金鑰
          </h2>
          <button type="button" onClick={onClose} className="font-sans text-xs tracking-[0.2em] text-ink-soft hover:text-ink">
            關閉
          </button>
        </div>
        <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
          填入你自己的 OpenAI 或 Claude 金鑰，就能收到 AI 為你寫的卡片與回音。費用由你自己的帳號支付。
        </p>

        {current && currentProvider ? (
          <div className="mt-5 rounded-xl bg-card p-4">
            <p className="font-sans text-xs tracking-[0.2em] text-moss">已設定 · {PROVIDER_NAMES[currentProvider]}</p>
            <p className="mt-1 font-sans text-sm text-ink-soft">{maskKey(current)}</p>
            <button
              type="button"
              onClick={removeKey}
              className="mt-3 border-b border-ink/30 pb-0.5 font-sans text-xs tracking-[0.2em] text-ink-soft hover:border-seal hover:text-seal"
            >
              刪除這把金鑰
            </button>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-card p-4 font-sans text-sm font-light text-ink-soft">
            目前沒有設定金鑰，使用的是內建的卡片與回饋。
          </p>
        )}

        <form onSubmit={saveKey} className="mt-5">
          <label className="block font-sans text-xs tracking-[0.2em] text-ink-soft" htmlFor="api-key">
            {current ? "換一把金鑰" : "貼上你的金鑰"}
          </label>
          <input
            id="api-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="sk-… 或 sk-ant-…"
            className="mt-2 w-full border-b border-ink/25 bg-transparent py-2 font-sans text-sm outline-none placeholder:text-ink-faint focus:border-moss"
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-seal">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!input.trim()}
            className="mt-4 w-full border border-ink/40 py-2.5 font-sans text-sm tracking-[0.4em] transition hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
          >
            儲存
          </button>
        </form>

        <details className="mt-6 border-t border-ink/10 pt-4" open={!current}>
          <summary className="cursor-pointer font-sans text-sm tracking-[0.15em] text-moss">還沒有金鑰？這樣申請</summary>
          <div className="mt-4 space-y-5 text-sm font-light leading-relaxed">
            <div>
              <p className="tracking-[0.2em]">OpenAI</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-ink-soft">
                <li>
                  到{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-moss underline underline-offset-2">
                    platform.openai.com/api-keys
                  </a>{" "}
                  登入
                </li>
                <li>按「Create new secret key」，複製以 sk- 開頭的金鑰</li>
                <li>到 Billing 儲值少量額度。API 和 ChatGPT 訂閱是分開計費的。</li>
              </ol>
            </div>
            <div>
              <p className="tracking-[0.2em]">Claude</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-ink-soft">
                <li>
                  到{" "}
                  <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-moss underline underline-offset-2">
                    console.anthropic.com
                  </a>{" "}
                  登入
                </li>
                <li>到 API Keys 按「Create Key」，複製以 sk-ant- 開頭的金鑰</li>
                <li>到 Billing 儲值少量額度</li>
              </ol>
            </div>
          </div>
        </details>

        <p className="mt-6 font-sans text-[11px] font-light leading-relaxed text-ink-faint">
          金鑰只存在這個瀏覽器裡。使用時會經由本站伺服器轉交給 AI 服務，伺服器不會儲存或記錄你的金鑰。建議在 AI 服務的後台設定每月花費上限。
        </p>
      </div>
    </div>
  );
}
