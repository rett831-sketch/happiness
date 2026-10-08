"use client";

import { useRef, useState } from "react";
import Branch from "./Branch";
import Moon from "./Moon";
import Seal from "./Seal";

// Falling osmanthus petals: [left %, delay s, duration s, drift px].
const PETALS: [number, number, number, number][] = [
  [70, 0, 2.6, -30], [78, 0.15, 3.1, -60], [84, 0.3, 2.8, -20], [74, 0.5, 3.4, -80],
  [88, 0.1, 3, -45], [80, 0.7, 2.7, -10], [66, 0.35, 3.2, -55], [90, 0.55, 2.9, -70],
  [72, 0.9, 3.3, -35], [82, 1.1, 2.6, -50], [76, 1.3, 3, -25], [86, 0.8, 3.5, -65],
];

/**
 * Poster-style header: a bamboo blind, one large brush character, a vertical
 * four-character couplet with a seal, and a branch hanging at the top right.
 *
 * The text block keeps a right padding (pr-16) so the branch's leaves never
 * cover it, even on a 360px-wide phone.
 *
 * Two easter eggs live here: tapping the branch shakes down osmanthus petals,
 * and holding the night moon shows a fox on it.
 */
export default function PosterHeader({
  glyph,
  label,
  couplet,
  seal,
  night = false,
  className = "",
  onBranchTap,
  onMoonHold,
}: {
  glyph: string;
  label: string;
  couplet: [string, string];
  seal: string;
  night?: boolean;
  className?: string;
  onBranchTap?: () => void;
  onMoonHold?: () => void;
}) {
  const [shower, setShower] = useState(0); // bumps on each tap, so the petals fall again
  const [moonFox, setMoonFox] = useState(false);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justHeld = useRef(false); // the click that ends a hold shouldn't hide the fox again

  function startHold() {
    justHeld.current = false;
    hold.current = setTimeout(() => {
      justHeld.current = true;
      setMoonFox(true);
      onMoonHold?.();
    }, 600);
  }
  function endHold() {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
  }

  return (
    <header className={`relative mx-auto h-[18rem] max-w-sm animate-rise ${className}`}>
      <div
        className={`absolute inset-y-0 left-2 right-8 rounded-[2px] bamboo-blind ${night ? "opacity-[0.07]" : "opacity-90"}`}
      />
      <Branch night={night} className="absolute -right-5 -top-6 h-60 w-28" />
      {onBranchTap && (
        <button
          type="button"
          aria-label="搖搖桂花枝"
          onClick={() => {
            setShower((n) => n + 1);
            onBranchTap();
          }}
          className="absolute -right-5 -top-6 h-60 w-24 [-webkit-tap-highlight-color:transparent]"
        />
      )}
      {shower > 0 && (
        <div key={shower} aria-hidden className="pointer-events-none absolute inset-x-0 -top-4 h-[24rem] overflow-hidden">
          {PETALS.map(([left, delay, duration, drift], i) => (
            <span
              key={i}
              className="petal absolute top-0 size-1.5 rounded-full bg-[#e2b54a]"
              style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                ["--drift" as string]: `${drift}px`,
              }}
            />
          ))}
        </div>
      )}
      {night && (
        // the moon, in the empty space under the couplet: it scrolls with the header, so it never covers text.
        // Holding it shows the fox on the moon.
        <button
          type="button"
          aria-label="月亮"
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => {
            if (justHeld.current) justHeld.current = false;
            else if (moonFox) setMoonFox(false);
          }}
          className={`absolute bottom-10 left-[52%] animate-fade select-none rounded-full shadow-[0_0_80px_26px_rgba(232,234,217,0.14)] transition-[width,height] duration-700 [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] ${
            moonFox ? "size-16" : "size-11"
          }`}
        >
          <Moon fox={moonFox} className="block size-full" />
        </button>
      )}

      <div className="pointer-events-none relative flex items-start gap-4 pl-6 pr-16 pt-10">
        <div className="flex shrink-0 flex-col items-center">
          <h1 className="font-brush text-[6.25rem] leading-none" aria-label={label}>
            {glyph}
          </h1>
          <p className={`mt-3 pl-[0.5em] text-sm tracking-[0.5em] ${night ? "text-moon/60" : "text-ink-soft"}`}>
            {label}
          </p>
        </div>
        <div className="flex shrink-0 items-end gap-2 pt-1">
          <p
            className={`text-base font-light leading-[1.9] tracking-[0.3em] [writing-mode:vertical-rl] ${
              night ? "text-moon/85" : "text-ink"
            }`}
          >
            {couplet[0]}
            <br />
            {couplet[1]}
          </p>
          <Seal text={seal} className="mb-1" />
        </div>
      </div>
    </header>
  );
}
