import type { CSSProperties } from "react";
import { ridgePath, seededRandom } from "@/lib/landscape";

// Film-grain texture, tiled over the whole page.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const W = 400;
const H = 300;

// Fixed seeds keep the hills identical on every visit.
function hills(seed: string, bottom = H) {
  const rand = seededRandom(seed);
  return [0, 1, 2].map((i) => ridgePath(rand, { width: W, base: 110 + i * 55, bottom, amplitude: 22 - i * 4 }));
}
const DAY_HILLS = hills("morning-hills");
const NIGHT_HILLS = hills("night-hills", 250);

const rand = seededRandom("sky");
const STARS = Array.from({ length: 18 }, () => ({
  left: `${rand() * 100}%`,
  top: `${rand() * 45}%`,
  delay: `${rand() * 6}s`,
}));
const FIREFLIES = Array.from({ length: 9 }, () => ({
  left: `${8 + rand() * 84}%`,
  bottom: `${8 + rand() * 30}%`,
  delay: `${-rand() * 14}s`,
  dx: `${(rand() - 0.5) * 120}px`,
  dy: `${-30 - rand() * 90}px`,
}));

function MistBand({ y, color, delay }: { y: number; color: string; delay: string }) {
  return (
    <rect
      x={-80}
      y={y}
      width={W + 160}
      height={46}
      fill={color}
      className="animate-drift"
      style={{ animationDelay: delay, "--dx": "60px", "--dy": "0px" } as CSSProperties}
    />
  );
}

/** Calm landscape background: misty green hills by day, a moonlit lake with fireflies at night. */
export default function Ambience({ night }: { night: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {night ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-night via-[#131f1e] to-[#1b2b29]" />
          {/* the moon itself is drawn in the evening header (PosterHeader), so it never sits under text */}
          {STARS.map((s, i) => (
            <span
              key={i}
              className="absolute size-px animate-glimmer rounded-full bg-moon"
              style={{ left: s.left, top: s.top, animationDelay: s.delay }}
            />
          ))}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[40vh] w-full">
            <defs>
              <linearGradient id="night-mist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5d6f6a" stopOpacity="0" />
                <stop offset="0.5" stopColor="#5d6f6a" stopOpacity="0.25" />
                <stop offset="1" stopColor="#5d6f6a" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={NIGHT_HILLS[0]} fill="#1f2f2c" />
            <MistBand y={135} color="url(#night-mist)" delay="0s" />
            <path d={NIGHT_HILLS[1]} fill="#182623" />
            <path d={NIGHT_HILLS[2]} fill="#111c1a" />
            {/* the lake, with the moon's reflection breaking into ripples */}
            <rect y={250} width={W} height={50} fill="#162321" />
            {Array.from({ length: 6 }, (_, i) => (
              <rect
                key={i}
                x={336 - 14 + i * 2.2} // moonlight on the lake
                y={258 + i * 6.5}
                width={28 - i * 4.4}
                height={1.3}
                rx={0.6}
                fill="#e8ead9"
                className="animate-glimmer"
                style={{ animationDelay: `${i * 0.7}s` }}
              />
            ))}
          </svg>
          {FIREFLIES.map((f, i) => (
            <span
              key={i}
              className="absolute size-1 animate-firefly rounded-full bg-[#eee7b0] shadow-[0_0_12px_4px_rgba(238,231,176,0.45)]"
              style={{ left: f.left, bottom: f.bottom, animationDelay: f.delay, "--dx": f.dx, "--dy": f.dy } as CSSProperties}
            />
          ))}
          <div className="absolute inset-0 opacity-[0.08] mix-blend-screen" style={{ backgroundImage: GRAIN }} />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#f4efe2] via-[#f2ecdc] to-[#ede6d2]" />
          {/* morning light */}
          <div className="absolute -right-24 -top-28 size-[30rem] rounded-full bg-[#f7e3b8]/60 blur-3xl" />
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[38vh] w-full">
            <defs>
              <linearGradient id="day-mist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f8f4e8" stopOpacity="0" />
                <stop offset="0.5" stopColor="#f8f4e8" stopOpacity="0.85" />
                <stop offset="1" stopColor="#f8f4e8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={DAY_HILLS[0]} fill="#dfe0c9" />
            <MistBand y={130} color="url(#day-mist)" delay="0s" />
            <path d={DAY_HILLS[1]} fill="#c8d0b2" />
            <MistBand y={185} color="url(#day-mist)" delay="-12s" />
            <path d={DAY_HILLS[2]} fill="#adbd9b" />
          </svg>
          <div className="absolute inset-0 opacity-[0.16] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
        </>
      )}
    </div>
  );
}
