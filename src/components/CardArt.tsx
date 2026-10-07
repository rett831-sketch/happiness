import { useId, type CSSProperties } from "react";
import { ridgePath, ridgeY, seededRandom } from "@/lib/landscape";

type Scene = {
  sky: [string, string]; // top, bottom
  sun: string;
  ridges: [string, string, string]; // far → near
  mist: string;
  water?: string;
  night?: boolean;
};

// Quiet natural scenes. Colors are soft and low-contrast on purpose.
const SCENES: Scene[] = [
  { sky: ["#f4e6cf", "#f2ecdc"], sun: "#e2b54a", ridges: ["#c9d1b5", "#a9b99a", "#7f9874"], mist: "#f8f4e8" }, // dawn
  { sky: ["#e9ead8", "#f3efe0"], sun: "#f3e3bd", ridges: ["#bfcab0", "#8ea482", "#5f7a5a"], mist: "#f8f4e8" }, // forest
  { sky: ["#e3e8dc", "#f2eee0"], sun: "#f1e2bf", ridges: ["#c3cdbd", "#9fb5ac", "#6f8f86"], mist: "#f6f3e8", water: "#b9cbc2" }, // lake
  { sky: ["#f0dcc5", "#f2e7d4"], sun: "#dd8c4f", ridges: ["#d4c3a8", "#a9a585", "#77805f"], mist: "#f7eee0" }, // dusk, persimmon sun
  { sky: ["#ecebdf", "#f4f1e6"], sun: "#f6efe0", ridges: ["#d6d9c8", "#b1bba6", "#87977f"], mist: "#f8f6ee" }, // misty peaks
  { sky: ["#1f2826", "#38423c"], sun: "#ece7d4", ridges: ["#3d4a42", "#2d3a33", "#1e2925"], mist: "#4c5850", water: "#252f2b", night: true }, // moonlit
  { sky: ["#ebeed9", "#f4f1e2"], sun: "#e2b54a", ridges: ["#d3dbb9", "#b2c293", "#86a06b"], mist: "#f8f6ea" }, // meadow, osmanthus sun
];

/** A small generated landscape (sky, sun or moon, mountain ridges, mist, sometimes pines or a lake), stable per `seed`. */
export default function CardArt({ seed, className = "" }: { seed: string; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, ""); // safe inside url(#...)
  const rand = seededRandom(seed);
  const between = (a: number, b: number) => a + rand() * (b - a);
  const scene = SCENES[Math.floor(rand() * SCENES.length)];

  const W = 300;
  const H = 400;
  const horizon = between(190, 235);
  const lakeTop = scene.water ? between(310, 330) : H;
  const ridges = scene.ridges.map((_, i) =>
    ridgePath(rand, {
      width: W,
      base: Math.min(horizon + i * between(32, 46), lakeTop - 30 + i * 6), // stay above the lake
      bottom: lakeTop,
      amplitude: between(14, 30) - i * 3,
    }),
  );
  const sunX = between(60, 240);
  const sunY = horizon - between(40, 110);
  const sunR = between(16, 30);
  const pines = rand() > 0.45 ? Math.floor(between(3, 9)) : 0;
  const pineStart = between(0, 160);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={scene.sky[0]} />
          <stop offset="1" stopColor={scene.sky[1]} />
        </linearGradient>
        <radialGradient id={`glow${id}`}>
          <stop offset="0" stopColor={scene.sun} stopOpacity="0.55" />
          <stop offset="1" stopColor={scene.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`mist${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={scene.mist} stopOpacity="0" />
          <stop offset="0.5" stopColor={scene.mist} stopOpacity="0.75" />
          <stop offset="1" stopColor={scene.mist} stopOpacity="0" />
        </linearGradient>
        <filter id={`grain${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={`url(#sky${id})`} />
      <circle cx={sunX} cy={sunY} r={sunR * 4} fill={`url(#glow${id})`} />
      <circle cx={sunX} cy={sunY} r={sunR} fill={scene.sun} opacity={scene.night ? 0.95 : 0.85} />

      {ridges.map((d, i) => (
        <g key={i}>
          <path d={d} fill={scene.ridges[i]} />
          {/* a drifting band of mist in front of each far ridge */}
          {i < 2 && (
            <rect
              x="-60"
              y={horizon + i * 40 - 10}
              width={W + 120}
              height="50"
              fill={`url(#mist${id})`}
              className="animate-drift"
              style={{ animationDelay: `${-i * 9}s`, "--dx": "40px", "--dy": "0px" } as CSSProperties}
            />
          )}
        </g>
      ))}

      {Array.from({ length: pines }, (_, i) => {
        const x = pineStart + i * between(12, 22);
        const h = between(22, 40);
        const y = ridgeY(ridges[2], x) + 4;
        return (
          <path
            key={i}
            d={`M${x} ${y - h} L${x - h * 0.28} ${y} L${x + h * 0.28} ${y} Z M${x} ${y - h * 0.75} L${x - h * 0.36} ${y - h * 0.15} L${x + h * 0.36} ${y - h * 0.15} Z`}
            fill={scene.ridges[2]}
            style={{ filter: "brightness(0.82)" }}
          />
        );
      })}

      {scene.water && (
        <g>
          <rect y={lakeTop} width={W} height={H - lakeTop} fill={scene.water} />
          {/* reflection of the sun/moon, broken into ripples */}
          {Array.from({ length: 6 }, (_, i) => (
            <rect
              key={i}
              x={sunX - sunR * (1 - i * 0.12)}
              y={lakeTop + 8 + i * 9}
              width={sunR * 2 * (1 - i * 0.12)}
              height="1.6"
              rx="0.8"
              fill={scene.sun}
              opacity={0.55 - i * 0.07}
            />
          ))}
        </g>
      )}

      <rect width={W} height={H} filter={`url(#grain${id})`} opacity="0.5" />
    </svg>
  );
}
