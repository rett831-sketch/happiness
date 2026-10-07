"use client";

import { useState } from "react";
import type { TaskCard as Card } from "@/lib/ai";

export default function TaskCard({
  card,
  badge,
  failed = false,
}: {
  card: Card | null;
  badge?: string;
  failed?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const ready = card !== null;

  return (
    <button
      type="button"
      onClick={() => ready && setFlipped(true)}
      disabled={!ready}
      aria-label={flipped ? "今日幸福任務卡" : "翻開今日幸福任務卡"}
      className="group block w-full max-w-sm perspective-[1200px] mx-auto"
    >
      <div
        className={`relative h-72 w-full transition-transform duration-700 transform-3d ${
          flipped ? "rotate-y-180" : "group-hover:-rotate-y-6"
        }`}
      >
        {/* back of card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 text-white shadow-xl backface-hidden">
          <span className="text-5xl">☀️</span>
          <p className="text-lg font-semibold tracking-widest">
            {ready ? "點一下，翻開今日卡片" : failed ? "卡片暫時沒抽到" : "正在為你抽卡…"}
          </p>
          {!ready && !failed && <span className="h-1.5 w-24 animate-pulse rounded-full bg-white/70" />}
        </div>

        {/* front of card */}
        <div className="absolute inset-0 flex rotate-y-180 flex-col justify-between rounded-3xl bg-white p-7 text-left text-stone-800 shadow-xl backface-hidden">
          <div>
            <p className="text-xs font-medium tracking-widest text-orange-500">
              {badge ?? "今日幸福任務"}
            </p>
            <h2 className="mt-2 text-2xl font-bold">{card?.title}</h2>
          </div>
          <p className="text-lg leading-relaxed">{card?.task}</p>
          <p className="text-sm text-stone-500">💡 {card?.hint}</p>
        </div>
      </div>
    </button>
  );
}
