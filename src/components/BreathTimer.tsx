"use client";

import { useEffect, useState } from "react";

const TOTAL = 30;
const BREATH = 10; // 4s inhale + 6s exhale, three breaths
const INHALE = 4;

const SENSES = [
  { label: "看見", text: "找一個讓你感到舒服的顏色" },
  { label: "聽見", text: "聽聽身邊最遠的那個聲音" },
  { label: "觸摸", text: "感受腳底穩穩踩著地面" },
  { label: "聞到", text: "留意此刻空氣的味道" },
  { label: "嚐到", text: "感受嘴裡淡淡的味道" },
];

export default function BreathTimer() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => {
      const t = (Date.now() - startedAt) / 1000;
      setElapsed(Math.min(t, TOTAL));
      if (t >= TOTAL) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [startedAt]);

  const running = startedAt !== null && elapsed < TOTAL;
  const done = startedAt !== null && elapsed >= TOTAL;
  const inhaling = running && elapsed % BREATH < INHALE;
  const breathNo = Math.min(Math.floor(elapsed / BREATH) + 1, 3);
  const sense = SENSES[Math.min(Math.floor(elapsed / (TOTAL / SENSES.length)), SENSES.length - 1)];
  const glyph = done ? "安" : running ? (inhaling ? "吸" : "吐") : "息";

  return (
    <section className="mx-auto w-full max-w-sm animate-rise text-center [animation-delay:200ms]">
      <div className="flex items-baseline justify-between border-t border-ink/15 pt-4">
        <p className="text-sm tracking-[0.3em] text-moss">調息</p>
        <p className="font-sans text-xs font-light tracking-[0.2em] text-ink-soft">三次深呼吸 · 三十秒</p>
      </div>

      <div className="relative mx-auto my-8 flex size-60 items-center justify-center">
        {/* progress ring: draws itself over the full 30 seconds */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.4" />
          {startedAt !== null && (
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              className="stroke-moss transition-[stroke-dashoffset] duration-100 ease-linear"
              strokeWidth="0.6"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - elapsed / TOTAL}
            />
          )}
        </svg>
        <div
          className={`absolute size-48 rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--color-dew),color-mix(in_srgb,var(--color-fern)_55%,transparent)_70%)] opacity-80 ease-in-out transition-transform ${
            inhaling ? "scale-100 duration-[4000ms]" : "scale-[0.58] duration-[6000ms]"
          }`}
        />
        <span key={glyph} className="relative animate-fade text-5xl font-light">
          {glyph}
        </span>
      </div>

      <div className="min-h-20">
        {running && (
          <div key={sense.label} className="animate-rise space-y-2">
            <p className="font-sans text-xs tracking-[0.4em] text-moss">{sense.label}</p>
            <p className="text-lg font-light">{sense.text}</p>
            <p className="font-latin text-sm italic text-ink-faint">
              {breathNo} / 3 · {Math.ceil(TOTAL - elapsed)}s
            </p>
          </div>
        )}
        {done && <p className="animate-rise text-lg font-light">心靜下來了，帶著這份平靜出發吧。</p>}
        {!running && !done && (
          <p className="text-[15px] font-light text-ink-soft">找個舒服的姿勢，跟著圓圈一起呼吸。</p>
        )}
      </div>

      {!running && (
        <button
          type="button"
          onClick={() => {
            setElapsed(0);
            setStartedAt(Date.now());
          }}
          className="mt-2 border-b border-ink/40 pb-1 font-sans text-sm tracking-[0.3em] transition hover:border-moss hover:text-moss"
        >
          {done ? "再一次" : "開始"}
        </button>
      )}
    </section>
  );
}
