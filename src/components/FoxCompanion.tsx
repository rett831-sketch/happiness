"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Fox, { POSE_NAMES, STAGE_NAMES, type FoxMood, type FoxPose } from "./Fox";
import { CARE, loadSeenPoses, markPoseSeen, progressToNext, stageFor, type CareKind, type FoxState } from "@/lib/fox";
import { EGGS, type EggId } from "@/lib/eggs";

/** An easter egg just triggered; `n` changes each time, so the same egg can play again. */
export type Special = { id: EggId; isNew: boolean; n: number };

const SHY_TAPS = 10; // taps in a row, each within SHY_GAP of the last
const SHY_GAP = 1500;

/** What is happening right now; decides 小福's pose and what it says. */
export type Situation =
  | "welcomeBack"
  | "morningCard"
  | "morningGift"
  | "morningFlipped"
  | "morningDone"
  | "breathing"
  | "breathDone"
  | "nightBefore"
  | "nightSending"
  | "nightAfter"
  | "lateSleep";

const SCENES: Record<Situation, { pose: FoxPose; mood?: FoxMood; line: string }> = {
  welcomeBack: { pose: "jump", line: "你回來了！我好想你。" },
  morningCard: { pose: "card", line: "早安！今天的小任務在這張卡片裡，翻開看看～" },
  morningGift: { pose: "card", line: "早安！昨晚我去了{place}，帶回這張卡片給你。" },
  morningFlipped: { pose: "tilt", line: "看起來不難對吧？做完記得告訴我喔。" },
  morningDone: { pose: "jump", line: "你做到了！我也覺得暖暖的。" },
  breathing: { pose: "tea", line: "我們一起，慢慢呼吸⋯⋯" },
  breathDone: { pose: "flower", line: "呼——心也變輕了。" },
  nightBefore: { pose: "lie", line: "今天過得好嗎？跟我說說三件好事吧。" },
  nightSending: { pose: "tilt", mood: "calm", line: "我在認真聽喔⋯⋯" },
  nightAfter: { pose: "explore", line: "謝謝你告訴我！我要帶著它們出門探險，明早見～" },
  lateSleep: { pose: "sleep", line: "（{name}睡著了，呼嚕呼嚕⋯⋯）" },
};

// Tapping 小福 shows one of these, in turn.
const TAPS: { pose: FoxPose; line: string }[] = [
  { pose: "cheeks", line: "嘿嘿，被你發現了。" },
  { pose: "heart", line: "這個送給你！" },
  { pose: "tilt", line: "嗯？你在看我嗎？" },
  { pose: "flower", line: "聞聞看，桂花好香！" },
  { pose: "wave", line: "我一直都在這裡陪你喔。" },
  { pose: "jump", line: "今天也要好好的！" },
];

export default function FoxCompanion({
  fox,
  situation,
  place,
  night = false,
  gained,
  special,
  onEgg,
}: {
  fox: FoxState;
  situation: Situation;
  /** Where 小福 went last night (for the morning gift). */
  place?: string;
  night?: boolean;
  /** Care just given, shown as a small "+10 陽光" note. */
  gained?: CareKind | null;
  /** An easter egg playing right now; it overrides the situation until the next tap. */
  special?: Special | null;
  onEgg?: (id: EggId) => void;
}) {
  // A tap overrides the pose until the situation (or easter egg) changes.
  const context = `${situation}|${special?.n ?? 0}`;
  const [tap, setTap] = useState<{ index: number; context: string } | null>(null);
  const tapped = tap && tap.context === context ? TAPS[tap.index] : null;
  const egg = special && !tapped ? EGGS[special.id] : null;
  const scene = egg ?? SCENES[situation];
  const pose = tapped?.pose ?? scene.pose;
  const mood = tapped ? undefined : scene.mood;
  const line = (tapped?.line ?? scene.line).replace("{name}", fox.name).replace("{place}", place ?? "遠方");
  const eggMotion = egg && special?.id === "shy" ? "fox-shy" : egg && special?.id === "note" ? "fox-spin" : "";

  // Ten quick taps in a row: the shy easter egg.
  const taps = useRef({ count: 0, at: 0 });
  function onTap() {
    const now = Date.now();
    const t = taps.current;
    t.count = now - t.at < SHY_GAP ? t.count + 1 : 1;
    t.at = now;
    if (t.count >= SHY_TAPS && onEgg) {
      t.count = 0;
      onEgg("shy");
      return;
    }
    setTap({ index: tap && tap.context === context ? (tap.index + 1) % TAPS.length : 0, context });
  }
  const stage = stageFor(fox.points);
  const asleep = situation === "lateSleep" && !tapped && !egg;

  // Every pose shown counts toward the pose collection in the handbook (/fox).
  // Poses not in the collection when the page opened are announced as newly collected.
  const [collectedBefore] = useState(loadSeenPoses);
  const newlyCollected = !collectedBefore.includes(pose);
  useEffect(() => markPoseSeen(pose), [pose]);

  return (
    <section className="mx-auto w-full max-w-sm animate-rise">
      <div className="flex items-end gap-3">
        <button
          type="button"
          onClick={onTap}
          aria-label={`摸摸${fox.name}`}
          className="shrink-0 transition-transform active:scale-95"
        >
          <span key={`${pose}-${stage}-${egg ? special?.n : ""}`} className="fox-pop block">
            <span className={`block ${eggMotion}`}>
              <Fox stage={stage} pose={pose} mood={mood} size={150} animated />
            </span>
          </span>
        </button>

        <div className="mb-10 flex-1">
          <div className="relative">
            <p
              key={line}
              className={`animate-fade rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                night ? "bg-white/10 text-moon" : "bg-card text-ink shadow-sm"
              } ${asleep ? "opacity-70" : ""}`}
            >
              {line}
            </p>
            {/* the bubble's little tail, pointing at 小福 */}
            <span
              className={`absolute -left-1.5 bottom-4 size-3 rotate-45 ${night ? "bg-white/10" : "bg-card"}`}
              aria-hidden
            />
          </div>
          {egg && special?.isNew ? (
            <Link
              href={`/fox?show=egg-${special.id}`}
              key={`egg-${special.id}`}
              className={`mt-2 block animate-rise font-sans text-xs tracking-[0.1em] underline-offset-4 hover:underline ${night ? "text-sun" : "text-seal"}`}
            >
              發現彩蛋「{egg.name}」
              <br />
              看圖鑑 ›
            </Link>
          ) : newlyCollected && (
            <Link
              href={`/fox?show=pose-${pose}`}
              key={`new-${pose}`}
              className={`mt-2 block animate-rise font-sans text-xs tracking-[0.1em] underline-offset-4 hover:underline ${night ? "text-sun" : "text-seal"}`}
            >
              收集到新動作「{POSE_NAMES[pose]}」
              <br />
              看圖鑑 ›
            </Link>
          )}
          {gained && (
            <p key={gained} className={`mt-2 animate-rise font-sans text-xs tracking-[0.2em] ${night ? "text-sun" : "text-moss"}`}>
              +{CARE[gained].points} {CARE[gained].label}
            </p>
          )}
        </div>
      </div>

      <div className={`mt-1 font-sans text-xs ${night ? "text-moon/70" : "text-ink-soft"}`}>
        <div className="flex items-baseline justify-between gap-3">
          <Link href="/fox" className="tracking-[0.15em] underline-offset-4 hover:underline">
            {fox.name} · {STAGE_NAMES[stage]} ›
          </Link>
          <span className="tabular-nums">
            陽光 {fox.sun} · 露水 {fox.dew} · 微風 {fox.breeze}
          </span>
        </div>
        <span className={`mt-1.5 block h-1.5 overflow-hidden rounded-full ${night ? "bg-white/10" : "bg-ink/10"}`}>
          <span
            className={`block h-full rounded-full transition-[width] duration-700 ${night ? "bg-sun/80" : "bg-moss"}`}
            style={{ width: `${Math.round(progressToNext(fox.points) * 100)}%` }}
          />
        </span>
      </div>
    </section>
  );
}
