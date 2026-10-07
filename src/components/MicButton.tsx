"use client";

import { useEffect, useRef, useState } from "react";

// Minimal typing for the browser's speech recognition (Chrome/Edge/Android: SpeechRecognition or
// webkitSpeechRecognition; iPhone Safari: webkitSpeechRecognition). Not in TypeScript's DOM types.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Tap to speak into a text field: the words appear as you talk. Hidden on browsers
 * without speech recognition. `onText` gets the field's text so far plus what was said.
 */
export default function MicButton({
  value,
  onText,
  label,
  night = false,
}: {
  value: string;
  onText: (text: string) => void;
  label: string;
  night?: boolean;
}) {
  const [supported] = useState(() => recognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => () => rec.current?.stop(), []);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "zh-TW";
    r.interimResults = true;
    r.continuous = false;
    const base = value ? value.trimEnd() + (/[，。！？、\s]$/.test(value) ? "" : "，") : "";
    r.onresult = (e) => {
      const said = Array.from(e.results, (result) => result[0].transcript).join("");
      onText(base + said);
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" ? "請允許使用麥克風" : "沒有聽清楚，再試一次");
    };
    r.onend = () => setListening(false);
    rec.current = r;
    setError(null);
    setListening(true);
    r.start();
  }

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-label={listening ? "停止語音輸入" : `用說的輸入${label}`}
        aria-pressed={listening}
        className={`flex size-9 items-center justify-center rounded-full transition ${
          listening
            ? "animate-pulse bg-seal text-paper"
            : night
              ? "text-moon/60 hover:bg-white/10 hover:text-moon"
              : "text-ink-soft hover:bg-ink/5 hover:text-ink"
        }`}
      >
        {/* microphone */}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
        </svg>
      </button>
      {error && (
        <span role="status" className="absolute right-0 top-full mt-1 whitespace-nowrap font-sans text-[11px] text-seal">
          {error}
        </span>
      )}
    </span>
  );
}
