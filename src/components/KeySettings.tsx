"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import {
  canRememberKey,
  clearApiKey,
  detectProvider,
  getApiKey,
  getKeyMode,
  loadApiKey,
  maskKey,
  PROVIDER_NAMES,
  setApiKey,
  type KeyMode,
} from "@/lib/apiKey";

/** Panel for entering, replacing or removing the visitor's own AI key (BYOK). */
export default function KeySettings({ onClose, onChange }: { onClose: () => void; onChange: () => void }) {
  const [current, setCurrent] = useState(() => ({ key: getApiKey(), mode: getKeyMode() }));
  const [input, setInput] = useState("");
  const [remember, setRemember] = useState(canRememberKey);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // With a key set, the form stays hidden until 「換一把金鑰」 is tapped.
  const [replacing, setReplacing] = useState(false);
  const currentProvider = current.key ? detectProvider(current.key) : null;
  const showForm = !current.key || replacing;

  // The stored key is decrypted asynchronously; show it once ready.
  useEffect(() => {
    loadApiKey().then(() => setCurrent({ key: getApiKey(), mode: getKeyMode() }));
  }, []);

  async function saveKey(e: React.FormEvent) {
    e.preventDefault();
    const key = input.trim();
    if (!detectProvider(key)) {
      setError("這看起來不像 API 金鑰。OpenAI 的金鑰以 sk- 開頭，Claude 的以 sk-ant- 開頭。");
      return;
    }
    setBusy(true);
    try {
      const mode: KeyMode = await setApiKey(key, remember ? "remember" : "session");
      setCurrent({ key, mode });
      setInput("");
      setError(null);
      setReplacing(false);
      onChange();
    } catch {
      setError("儲存失敗了，請再試一次。");
    } finally {
      setBusy(false);
    }
  }

  async function removeKey() {
    await clearApiKey();
    setCurrent({ key: null, mode: null });
    setReplacing(false);
    onChange();
  }

  /** Keeps the same key, but remembered or for this tab only: no need to paste it again. */
  async function switchMode() {
    if (!current.key) return;
    setBusy(true);
    try {
      const mode = await setApiKey(current.key, current.mode === "remember" ? "session" : "remember");
      setCurrent({ key: current.key, mode });
    } finally {
      setBusy(false);
    }
  }

  function startReplacing() {
    setRemember(canRememberKey() && current.mode !== "session");
    setReplacing(true);
  }

  function cancelReplacing() {
    setReplacing(false);
    setInput("");
    setError(null);
  }

  const link = "border-b border-ink/30 pb-0.5 font-sans text-xs tracking-[0.2em] text-ink-soft";

  return (
    <Sheet onClose={onClose} aria-labelledby="key-settings-title">
      {/* stays at the top of the screen while the panel scrolls, so 關閉 is always in reach */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 flex items-baseline justify-between rounded-t-[1.5rem] bg-paper px-6 pb-3 pt-6">
        <h2 id="key-settings-title" className="text-xl tracking-[0.2em]">
          AI 金鑰
        </h2>
        <button type="button" onClick={onClose} className="font-sans text-xs tracking-[0.2em] text-ink-soft hover:text-ink">
          關閉
        </button>
      </div>
      <p className="mt-1 text-sm font-light leading-relaxed text-ink-soft">
        填入你自己的 OpenAI 或 Claude 金鑰，就能收到 AI 為你寫的卡片與回音。費用由你自己的帳號支付。
      </p>

      {current.key && currentProvider ? (
        <div className="mt-5 rounded-xl bg-card p-4">
          <p className="font-sans text-xs tracking-[0.2em] text-moss">已設定 · {PROVIDER_NAMES[currentProvider]}</p>
          <p className="mt-1 font-sans text-sm text-ink-soft">{maskKey(current.key)}</p>
          <p className="mt-1 font-sans text-xs font-light text-ink-soft">
            {current.mode === "remember" ? "已加密保存在這台裝置" : "只在這次使用，關閉分頁就會清除"}
          </p>
          {canRememberKey() && (
            <button
              type="button"
              onClick={switchMode}
              disabled={busy}
              className="mt-3 w-full rounded-full border border-moss/50 py-2 font-sans text-xs tracking-[0.2em] text-moss transition hover:bg-moss hover:text-paper disabled:opacity-40"
            >
              {current.mode === "remember" ? "改成只在這次使用" : "改成記住這把金鑰"}
            </button>
          )}
          {!replacing && (
            <div className="mt-4 flex gap-5">
              <button type="button" onClick={startReplacing} className={`${link} hover:border-moss hover:text-moss`}>
                換一把金鑰
              </button>
              <button type="button" onClick={removeKey} className={`${link} hover:border-seal hover:text-seal`}>
                刪除這把金鑰
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-card p-4 font-sans text-sm font-light text-ink-soft">
          目前沒有設定金鑰，使用的是內建的卡片與回饋。
        </p>
      )}

      {showForm && (
        <form onSubmit={saveKey} className="mt-5">
          <label className="block font-sans text-xs tracking-[0.2em] text-ink-soft" htmlFor="api-key">
            {current.key ? "換一把金鑰" : "貼上你的金鑰"}
          </label>
          <input
            id="api-key"
            autoFocus={replacing}
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="sk-… 或 sk-ant-…"
            className="mt-2 w-full border-b border-ink/25 bg-transparent py-2 font-sans text-sm outline-none placeholder:text-ink-faint focus:border-moss"
          />
          {canRememberKey() ? (
            <label className="mt-4 flex items-start gap-2.5 font-sans text-sm font-light leading-relaxed text-ink-soft">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="mt-1 size-4 shrink-0 accent-moss"
              />
              <span>
                記住這把金鑰
                <span className="block text-xs text-ink-faint">
                  {remember ? "加密後存在這台裝置，下次打開不用再貼。" : "只在這次使用，關閉分頁就會清除。借別人的電腦時建議這樣用。"}
                </span>
              </span>
            </label>
          ) : (
            <p className="mt-4 font-sans text-xs font-light leading-relaxed text-ink-faint">
              這個網址不支援加密，金鑰只會保留到關閉分頁。
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-seal">
              {error}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            {replacing && (
              <button type="button" onClick={cancelReplacing} className="flex-1 py-2.5 font-sans text-sm tracking-[0.4em] text-ink-soft hover:text-ink">
                取消
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="flex-[2] border border-ink/40 py-2.5 font-sans text-sm tracking-[0.4em] transition hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
            >
              儲存
            </button>
          </div>
        </form>
      )}

      <details className="mt-6 border-t border-ink/10 pt-4" open={!current.key}>
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
        金鑰只存在這個瀏覽器裡，並用 AES-GCM 加密後才保存。使用時會經由本站伺服器轉交給 AI 服務，伺服器不會儲存或記錄你的金鑰。建議在 AI 服務的後台設定每月花費上限。
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full rounded-full bg-card py-2.5 font-sans text-sm tracking-[0.4em] text-ink-soft hover:text-ink"
      >
        關閉
      </button>
    </Sheet>
  );
}
