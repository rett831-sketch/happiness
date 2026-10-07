// A hand-drawn branch hanging from the top, with leaves and small osmanthus clusters.
// Flat gouache-like colors; sways very slightly from its top edge.

const LEAF = "M0 0 C9 -9 25 -10 36 0 C25 10 9 9 0 0 Z";

// [x, y, angle (deg), scale, color]
const LEAVES: [number, number, number, number, 0 | 1 | 2][] = [
  [116, 26, 160, 0.8, 1],
  [121, 64, 25, 1, 0],
  [117, 102, 150, 1.05, 2],
  [100, 146, 35, 0.95, 1],
  [148, 150, 60, 0.75, 0],
  [86, 184, 165, 1.1, 0],
  [82, 222, 20, 0.9, 2],
  [78, 258, 155, 1, 1],
  [66, 296, 40, 0.85, 0],
];

const FLOWERS: [number, number][] = [
  [128, 88], [134, 95], [125, 98],
  [92, 168], [99, 174], [90, 177],
  [72, 278], [79, 284],
];

const DAY = { stem: "#7d6b52", leaves: ["#7f9874", "#a6b996", "#5f7a5a"], vein: "#e7ead7", flower: "#e2b54a" };
const NIGHT = { stem: "#2b2a24", leaves: ["#2c3a33", "#36463d", "#24302a"], vein: "#3f4e45", flower: "#8b7b4a" };

export default function Branch({ night = false, className = "" }: { night?: boolean; className?: string }) {
  const c = night ? NIGHT : DAY;
  return (
    <div aria-hidden className={`pointer-events-none origin-top animate-sway ${className}`}>
      <svg viewBox="0 0 200 330" className="h-full w-full overflow-visible">
        <path
          d="M118 -10 C112 40 132 70 112 120 S70 190 84 240 S66 300 58 330"
          fill="none"
          stroke={c.stem}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path d="M112 122 C126 132 138 140 150 148" fill="none" stroke={c.stem} strokeWidth="1.6" strokeLinecap="round" />
        {LEAVES.map(([x, y, angle, scale, color], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
            <path d={LEAF} fill={c.leaves[color]} />
            <path d="M2 0 L32 0" stroke={c.vein} strokeWidth="0.8" opacity="0.7" />
          </g>
        ))}
        {FLOWERS.map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i * 23})`} fill={c.flower}>
            <ellipse cx="0" cy="-2.6" rx="1.6" ry="2.6" />
            <ellipse cx="0" cy="2.6" rx="1.6" ry="2.6" />
            <ellipse cx="-2.6" cy="0" rx="2.6" ry="1.6" />
            <ellipse cx="2.6" cy="0" rx="2.6" ry="1.6" />
          </g>
        ))}
      </svg>
    </div>
  );
}
