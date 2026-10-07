"use client";

import { useEffect, useState } from "react";

const TOTAL = 30;
const BREATH = 10; // 4s inhale + 6s exhale, three breaths
const INHALE = 4;

const SENSES = [
  { icon: "👀", text: "看見：找一個讓你舒服的顏色" },
  { icon: "👂", text: "聽見：聽聽身邊最遠的聲音" },
  { icon: "✋", text: "觸摸：感受腳底踩著地面" },
  { icon: "👃", text: "聞到：留意空氣的味道" },
  { icon: "👅", text: "嚐到：感受嘴裡此刻的味道" },
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
  const inCycle = elapsed % BREATH;
  const inhaling = running && inCycle < INHALE;
  const breathNo = Math.min(Math.floor(elapsed / BREATH) + 1, 3);
  const sense = SENSES[Math.min(Math.floor(elapsed / (TOTAL / SENSES.length)), SENSES.length - 1)];

  return (
    <section className="mx-auto w-full max-w-sm rounded-3xl bg-white/70 p-6 text-center shadow-sm backdrop-blur">
      <h3 className="font-semibold text-stone-700">🌬️ 30 秒五感呼吸</h3>
      <p className="mt-1 text-sm text-stone-500">深呼吸三次，帶著平靜去完成今天的任務</p>

      <div className="my-6 flex h-44 items-center justify-center">
        <div
          className={`flex size-40 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-emerald-200 ease-in-out ${
            inhaling ? "scale-100 duration-[4000ms]" : "scale-60 duration-[6000ms]"
          } transition-transform`}
        >
          <span className="text-lg font-medium text-stone-700">
            {done ? "完成 🌱" : running ? (inhaling ? "吸氣…" : "吐氣…") : "準備好了嗎？"}
          </span>
        </div>
      </div>

      {running && (
        <div className="space-y-1">
          <p className="text-stone-700">
            {sense.icon} {sense.text}
          </p>
          <p className="text-xs text-stone-400">
            第 {breathNo} / 3 次呼吸 · 剩 {Math.ceil(TOTAL - elapsed)} 秒
          </p>
        </div>
      )}

      {done && <p className="text-stone-600">很好，帶著這份平靜出發吧。</p>}

      {!running && (
        <button
          type="button"
          onClick={() => {
            setElapsed(0);
            setStartedAt(Date.now());
          }}
          className="mt-4 rounded-full bg-stone-800 px-6 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          {done ? "再來一次" : "開始呼吸"}
        </button>
      )}
    </section>
  );
}
