"use client";

import { useState } from "react";
import type { TaskCard as Card } from "@/lib/ai";
import CardArt from "./CardArt";

export default function TaskCard({
  card,
  seed,
  dateLabel,
  badge,
  failed = false,
  onFlip,
}: {
  card: Card | null;
  /** Seed for the artwork on the back of the card (e.g. today's date). */
  seed: string;
  /** Date shown on the card, e.g. "十月七日". */
  dateLabel: string;
  badge?: string;
  failed?: boolean;
  /** Called when the card is turned over. */
  onFlip?: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const ready = card !== null;

  return (
    <div className="mx-auto w-full max-w-sm animate-rise">
      <button
        type="button"
        onClick={() => {
          if (!ready || flipped) return;
          setFlipped(true);
          onFlip?.();
        }}
        disabled={!ready}
        aria-label={flipped ? "今日幸福任務卡" : "翻開今日幸福任務卡"}
        className="group block w-full perspective-[1400px]"
      >
        <div
          className={`relative h-[27rem] w-full transition-transform duration-[1100ms] ease-[cubic-bezier(0.6,0,0.2,1)] transform-3d ${
            flipped ? "rotate-y-180" : "group-hover:-rotate-y-3"
          }`}
        >
          {/* back: today's artwork */}
          <div className="absolute inset-0 overflow-hidden rounded-[3px] bg-card shadow-[0_30px_60px_-30px_rgba(42,37,33,0.45)] backface-hidden">
            <CardArt seed={seed} className={`size-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-60"}`} />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between bg-card/90 px-4 py-3 backdrop-blur-sm">
              <div className="text-left">
                <p className="text-sm tracking-[0.2em] text-ink-soft">{dateLabel}</p>
                <p className="mt-0.5 text-lg tracking-[0.2em]">
                  {ready ? "今日之卡" : failed ? "暫時沒有抽到" : "正在為你準備"}
                </p>
              </div>
              <p className="font-sans text-[11px] tracking-[0.3em] text-ink-soft">
                {ready ? "輕觸翻面" : failed ? "" : "· · ·"}
              </p>
            </div>
          </div>

          {/* front: the practice itself */}
          <div className="absolute inset-0 flex rotate-y-180 flex-col bg-card p-7 text-left shadow-[0_30px_60px_-30px_rgba(42,37,33,0.45)] backface-hidden rounded-[3px]">
            <div className="flex items-baseline justify-between">
              <p className="text-sm tracking-[0.3em] text-moss">{badge ?? "今日之事"}</p>
              <p className="text-sm tracking-[0.15em] text-ink-faint">{dateLabel}</p>
            </div>
            <div className="mt-3 h-px bg-ink/15" />

            {card && (
              <>
                <div className="mt-5 h-20 overflow-hidden">
                  <CardArt seed={card.title} className="h-full w-full" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-wide">{card.title}</h2>
                <p className="mt-4 text-[1.2rem] font-light leading-[1.9]">{card.task}</p>
                <p className="mt-auto flex gap-3 font-sans text-[13px] font-light leading-relaxed text-ink-soft">
                  <span className="mt-[0.7em] h-px w-5 shrink-0 bg-ink-soft/50" />
                  {card.hint}
                </p>
              </>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
