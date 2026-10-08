// 小福: the little fox companion, drawn as plain SVG (no hooks or CSS), so the same
// drawing works in the page and in generated images. Helpers are plain functions,
// not components, because Satori only allows real SVG elements inside <svg>.
//
// Style: flat and geometric, no outlines. Each shape is two-toned (lighter on the
// left, darker on the right), which gives depth without detail.
import type { ReactNode } from "react";

export type FoxStage = 1 | 2 | 3 | 4 | 5;
export type FoxMood = "calm" | "happy" | "sleep" | "excited";
export type FoxPose =
  | "sit"
  | "wave"
  | "jump"
  | "lie"
  | "sleep"
  | "tea"
  | "card"
  | "explore"
  | "tilt"
  | "flower"
  | "cheeks"
  | "heart";

export const STAGE_NAMES: Record<FoxStage, string> = {
  1: "小毛球",
  2: "小狐崽",
  3: "少年狐",
  4: "長大了",
  5: "桂花狐",
};

export const POSE_NAMES: Record<FoxPose, string> = {
  sit: "坐著",
  wave: "揮手",
  jump: "跳起來",
  lie: "趴著",
  sleep: "睡覺",
  tea: "喝茶",
  card: "送卡片",
  explore: "出門探險",
  tilt: "歪頭",
  flower: "聞花",
  cheeks: "捧臉",
  heart: "送愛心",
};

const DEFAULT_MOOD: Record<FoxPose, FoxMood> = {
  sit: "calm",
  wave: "happy",
  jump: "excited",
  lie: "calm",
  sleep: "sleep",
  tea: "calm",
  card: "happy",
  explore: "excited",
  tilt: "excited",
  flower: "happy",
  cheeks: "happy",
  heart: "happy",
};

const FUR_L = "#f08c3e"; // lit side
const FUR_R = "#e0672b"; // shaded side
const CREAM_L = "#f4e6cb";
const CREAM_R = "#e8d4b1";
const DARK = "#6b3720"; // inner ears, paws
const INK = "#1f1a17";
const BLUSH = "#f0866f";
const FLOWER = "#e2b54a"; // osmanthus

type Pose = {
  head: { x: number; y: number; r: number };
  body: { x: number; y: number; rx: number; ry: number };
  tailSize: number;
};

// Head stays big at every stage; the body and tail grow.
const POSES: Record<Exclude<FoxStage, 1>, Pose> = {
  2: { head: { x: 96, y: 86, r: 46 }, body: { x: 96, y: 152, rx: 30, ry: 28 }, tailSize: 0.72 },
  3: { head: { x: 94, y: 82, r: 43 }, body: { x: 94, y: 146, rx: 32, ry: 33 }, tailSize: 0.86 },
  4: { head: { x: 92, y: 76, r: 40 }, body: { x: 92, y: 140, rx: 34, ry: 39 }, tailSize: 1 },
  5: { head: { x: 92, y: 76, r: 40 }, body: { x: 92, y: 140, rx: 34, ry: 39 }, tailSize: 1 },
};

/** Builds a path from the right half's points (in units of r) and its mirror image. */
function halves(x: number, y: number, r: number, points: [number, number][]) {
  const toPath = (side: 1 | -1) =>
    "M " + points.map(([dx, dy]) => `${x + side * dx * r} ${y + dy * r}`).join(" L ") + " Z";
  return { left: toPath(-1), right: toPath(1) };
}

/** Two-toned ellipse: lit left half, shaded right half. */
function ellipse2(cx: number, cy: number, rx: number, ry: number, left: string, right: string) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={left} />
      <path d={`M ${cx} ${cy - ry} A ${rx} ${ry} 0 0 1 ${cx} ${cy + ry} Z`} fill={right} />
    </g>
  );
}

// --- head ---

// Right half of the head: rounded top, widest at the cheek, then straight to a pointed snout.
const HEAD: [number, number][] = [
  [0, -0.84], [0.32, -0.84], [0.6, -0.74], [0.8, -0.54], [0.95, -0.24], [1.08, 0.04], [0.62, 0.52], [0, 1],
];
// Right half of the cream mask: up to the eye line, then down to the snout.
const MASK: [number, number][] = [
  [0, 0.4], [0.2, 0.12], [0.5, 0.0], [0.82, -0.02], [1.08, 0.04], [0.62, 0.52], [0, 1],
];
// Ears: outer triangle and the dark inside.
const EAR: [number, number][] = [[0.18, -0.8], [0.66, -1.48], [0.98, -0.44]];
const EAR_IN: [number, number][] = [[0.34, -0.8], [0.66, -1.28], [0.84, -0.6]];

function head({ x, y, r }: Pose["head"]) {
  const h = halves(x, y, r, HEAD);
  const m = halves(x, y, r, MASK);
  const e = halves(x, y, r, EAR);
  const ei = halves(x, y, r, EAR_IN);
  return (
    <g>
      {/* each ear in its own group so it can twitch (see .fox-alive in globals.css) */}
      <g className="fox-ear fox-ear-l">
        <path d={e.left} fill={FUR_L} />
        <path d={ei.left} fill={DARK} />
      </g>
      <g className="fox-ear fox-ear-r">
        <path d={e.right} fill={FUR_R} />
        <path d={ei.right} fill={DARK} />
      </g>
      <path d={h.left} fill={FUR_L} />
      <path d={h.right} fill={FUR_R} />
      <path d={m.left} fill={CREAM_L} />
      <path d={m.right} fill={CREAM_R} />
    </g>
  );
}

function face({ x, y, r, mood }: { x: number; y: number; r: number; mood: FoxMood }) {
  const ex = r * 0.38;
  const ey = y + r * 0.06;
  const er = r * 0.12;
  const lw = r * 0.065;

  const eye = (side: 1 | -1) => {
    const cx = x + side * ex;
    if (mood === "happy")
      return <path key={side} d={`M ${cx - er} ${ey + er * 0.4} Q ${cx} ${ey - er * 1.2} ${cx + er} ${ey + er * 0.4}`} fill="none" stroke={INK} strokeWidth={lw} strokeLinecap="round" />;
    if (mood === "sleep")
      return <path key={side} d={`M ${cx - er} ${ey} Q ${cx} ${ey + er} ${cx + er} ${ey}`} fill="none" stroke={INK} strokeWidth={lw} strokeLinecap="round" />;
    const rr = er * (mood === "excited" ? 1.3 : 1.15);
    return (
      <g key={side}>
        <circle cx={cx} cy={ey} r={rr} fill={INK} />
        <circle cx={cx + rr * 0.35} cy={ey - rr * 0.35} r={rr * 0.38} fill="#ffffff" />
        <circle cx={cx - rr * 0.38} cy={ey + rr * 0.38} r={rr * 0.16} fill="#ffffff" />
      </g>
    );
  };

  // short blush lines under the eyes
  const blush = (side: 1 | -1) => (
    <path
      key={`c${side}`}
      d={`M ${x + side * (ex - er * 1.1)} ${ey + er * 2.1} L ${x + side * (ex + er * 1.1)} ${ey + er * 2.1}`}
      stroke={BLUSH}
      strokeWidth={lw * 1.1}
      strokeLinecap="round"
      opacity={0.8}
    />
  );

  return (
    <g>
      {blush(-1)}
      {blush(1)}
      {/* open eyes blink now and then (see .fox-alive in globals.css) */}
      <g className={mood === "calm" || mood === "excited" ? "fox-blink" : undefined}>
        {eye(-1)}
        {eye(1)}
      </g>
      <ellipse cx={x} cy={y + r * 0.9} rx={r * 0.1} ry={r * 0.08} fill={INK} />
    </g>
  );
}

// --- body ---

/** Tail: a leaf-shaped brush raised beside the body, shaded, with a cream tip. */
function tail({ x, y, s }: { x: number; y: number; s: number }) {
  const p = (dx: number, dy: number) => `${x + dx * s} ${y + dy * s}`;
  return (
    <g className="fox-tail">
      <path d={`M ${p(0, 0)} C ${p(30, 4)} ${p(56, -14)} ${p(56, -44)} C ${p(56, -66)} ${p(46, -82)} ${p(36, -90)} C ${p(30, -66)} ${p(24, -40)} ${p(0, -22)} Z`} fill={FUR_R} />
      <path d={`M ${p(56, -58)} C ${p(54, -72)} ${p(46, -84)} ${p(36, -90)} C ${p(34, -78)} ${p(33, -68)} ${p(32, -60)} C ${p(40, -56)} ${p(48, -56)} ${p(56, -58)} Z`} fill={CREAM_L} />
    </g>
  );
}

/** A raised arm: a short, plump oval from the shoulder, ending in a mitten-like paw. */
function limb(x1: number, y1: number, x2: number, y2: number, w: number) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={len / 2 + w * 0.25} ry={w / 2} fill={FUR_L} transform={`rotate(${angle} ${cx} ${cy})`} />
      <ellipse cx={x2} cy={y2} rx={w * 0.52} ry={w * 0.46} fill={DARK} transform={`rotate(${angle} ${x2} ${y2})`} />
    </g>
  );
}

/** A small paw resting against the body. */
function paw(cx: number, cy: number, rx: number, angle: number) {
  return <ellipse cx={cx} cy={cy} rx={rx * 0.15} ry={rx * 0.21} fill={DARK} transform={`rotate(${angle} ${cx} ${cy})`} />;
}

/** Sitting body with a cream bib; feet forward (or tucked up when jumping). */
function body({ x, y, rx, ry }: Pose["body"], tucked = false) {
  const foot = (side: 1 | -1) => {
    const cx = x + side * rx * (tucked ? 0.34 : 0.55);
    const cy = y + ry * (tucked ? 0.96 : 0.92);
    return <ellipse key={side} cx={cx} cy={cy} rx={rx * 0.27} ry={rx * 0.17} fill={DARK} transform={`rotate(${side * (tucked ? 36 : 12)} ${cx} ${cy})`} />;
  };
  return (
    <g>
      {ellipse2(x, y, rx, ry, FUR_L, FUR_R)}
      {ellipse2(x, y - ry * 0.2, rx * 0.62, ry * 0.62, CREAM_L, CREAM_R)}
      {foot(-1)}
      {foot(1)}
    </g>
  );
}

// --- props ---

/** A purple-clay (紫砂) teacup held at the chest; its warm red-brown stands out from fur, scarf and jacket. */
function teacup(x: number, y: number, s: number) {
  return (
    <g>
      <path d={`M ${x - 13 * s} ${y - 10 * s} L ${x + 13 * s} ${y - 10 * s} L ${x + 9 * s} ${y + 8 * s} L ${x - 9 * s} ${y + 8 * s} Z`} fill="#9a5640" />
      <path d={`M ${x} ${y - 10 * s} L ${x + 13 * s} ${y - 10 * s} L ${x + 9 * s} ${y + 8 * s} L ${x} ${y + 8 * s} Z`} fill="#844634" />
      <rect x={x - 13 * s} y={y - 11.5 * s} width={26 * s} height={3 * s} rx={1.5 * s} fill="#c98b6d" />
    </g>
  );
}

/** A sprig of osmanthus held up to the nose: a brown twig, a leaf, and a cluster of yellow flowers. */
function osmanthusSprig(fromX: number, fromY: number, toX: number, toY: number, s: number) {
  const flower = (cx: number, cy: number, k: number) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx - 2.2 * s * k} cy={cy} r={1.9 * s * k} fill={FLOWER} />
      <circle cx={cx + 2.2 * s * k} cy={cy} r={1.9 * s * k} fill={FLOWER} />
      <circle cx={cx} cy={cy - 2.2 * s * k} r={1.9 * s * k} fill={FLOWER} />
      <circle cx={cx} cy={cy + 2.2 * s * k} r={1.9 * s * k} fill={FLOWER} />
      <circle cx={cx} cy={cy} r={1.2 * s * k} fill="#c98f22" />
    </g>
  );
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  return (
    <g>
      <path d={`M ${fromX} ${fromY} Q ${midX - 4 * s} ${midY} ${toX} ${toY}`} fill="none" stroke="#8a6542" strokeWidth={2.4 * s} strokeLinecap="round" />
      <ellipse cx={midX - 8 * s} cy={midY + 2 * s} rx={7 * s} ry={3 * s} fill="#5f7a52" transform={`rotate(25 ${midX - 8 * s} ${midY + 2 * s})`} />
      {flower(toX, toY, 1.5)}
      {flower(toX - 8 * s, toY + 5 * s, 1.2)}
      {flower(toX + 5 * s, toY + 7 * s, 1.1)}
      {flower(toX - 3 * s, toY - 7 * s, 1.0)}
    </g>
  );
}

/** A big postcard with a sun and hills, held up in front of the chest to show you. */
function postcard(x: number, y: number, s: number) {
  return (
    <g transform={`rotate(-6 ${x} ${y})`}>
      <rect x={x - 19 * s} y={y - 15 * s} width={38 * s} height={30 * s} rx={2.5 * s} fill="#ffffff" opacity={0.6} transform={`translate(${2 * s} ${2 * s})`} />
      <rect x={x - 17 * s} y={y - 13 * s} width={34 * s} height={26 * s} rx={2 * s} fill="#fbf6ea" />
      <circle cx={x + 6 * s} cy={y - 4 * s} r={3.5 * s} fill={FLOWER} />
      <path d={`M ${x - 14 * s} ${y + 10 * s} Q ${x - 6 * s} ${y + 1 * s} ${x + 1 * s} ${y + 6 * s} Q ${x + 8 * s} ${y + 2 * s} ${x + 14 * s} ${y + 8 * s} L ${x + 14 * s} ${y + 10 * s} Z`} fill="#a9b99a" />
    </g>
  );
}

/** A big two-toned heart held in front of the chest. */
function heartShape(x: number, y: number, s: number) {
  const p = (dx: number, dy: number) => `${x + dx * s} ${y + dy * s}`;
  return (
    <g>
      <path d={`M ${p(0, 14)} C ${p(-26, -2)} ${p(-16, -22)} ${p(0, -10)} L ${p(0, 14)} Z`} fill="#f39a9a" />
      <path d={`M ${p(0, 14)} C ${p(26, -2)} ${p(16, -22)} ${p(0, -10)} L ${p(0, 14)} Z`} fill="#e67f86" />
      {/* a soft lighter-pink shine on the left lobe */}
      <ellipse cx={x - 8 * s} cy={y - 7 * s} rx={3.4 * s} ry={1.8 * s} fill="#f9bcbc" transform={`rotate(-38 ${x - 8 * s} ${y - 7 * s})`} />
    </g>
  );
}

/** Tail curled around the front feet, the way a fox sits. */
function tailAroundFeet(x: number, y: number, rx: number, ry: number) {
  const p = (dx: number, dy: number) => `${x + dx * rx} ${y + dy * ry}`;
  return (
    <g className="fox-tail-curl">
      <path d={`M ${p(0.92, 0.5)} C ${p(1.22, 1.06)} ${p(-0.2, 1.18)} ${p(-0.86, 0.98)} C ${p(-1.1, 0.88)} ${p(-1.06, 0.66)} ${p(-0.84, 0.66)} C ${p(-0.2, 0.74)} ${p(0.46, 0.64)} ${p(0.7, 0.34)} Z`} fill={FUR_R} />
      <path d={`M ${p(-0.86, 0.98)} C ${p(-1.08, 0.9)} ${p(-1.04, 0.72)} ${p(-0.84, 0.74)} C ${p(-0.72, 0.76)} ${p(-0.6, 0.78)} ${p(-0.5, 0.8)} C ${p(-0.54, 0.9)} ${p(-0.62, 0.98)} ${p(-0.86, 0.98)} Z`} fill={CREAM_L} />
    </g>
  );
}

/** A backpack: the bag peeks out behind both sides of the body (drawn before the body). */
function backpackBack({ x, y, rx, ry }: Pose["body"]) {
  const w = rx * 2.24;
  const h = ry * 1.25;
  return (
    <g>
      <rect x={x - w / 2} y={y - ry * 0.98} width={w} height={h} rx={rx * 0.32} fill="#a8774c" />
      <rect x={x} y={y - ry * 0.98} width={w / 2} height={h} rx={rx * 0.32} fill="#94653d" />
    </g>
  );
}

/** The backpack's shoulder straps across the chest (drawn after the body). */
function backpackStraps({ x, y, rx, ry }: Pose["body"]) {
  const strap = (side: 1 | -1) => (
    <path
      key={side}
      d={`M ${x + side * rx * 0.4} ${y - ry * 0.95} C ${x + side * rx * 0.36} ${y - ry * 0.4} ${x + side * rx * 0.44} ${y} ${x + side * rx * 0.6} ${y + ry * 0.38}`}
      fill="none"
      stroke={side === -1 ? "#7d5434" : "#6c482c"}
      strokeWidth={rx * 0.17}
      strokeLinecap="round"
    />
  );
  return (
    <g>
      {strap(-1)}
      {strap(1)}
      <rect x={x - rx * 0.5} y={y - ry * 0.32} width={rx * 0.18} height={rx * 0.14} rx={rx * 0.03} fill="#e2b54a" />
    </g>
  );
}

/** A point on the body ellipse at `deg` degrees (0 = right, 90 = bottom). */
function onBody({ x, y, rx, ry }: Pose["body"], deg: number) {
  const a = (deg * Math.PI) / 180;
  return `${x + rx * Math.cos(a)} ${y + ry * Math.sin(a)}`;
}

/** A haori (short Japanese jacket): two panels over the body, open in front, with a collar. */
function haori(b: Pose["body"], left: string, right: string, collar: string, dots?: string) {
  const { x, y, rx, ry } = b;
  const panel = (side: 1 | -1) => {
    // from beside the neck, around the outside of the body, to the bottom, then up the open front
    const top = side === -1 ? 258 : 282;
    const bottom = side === -1 ? 112 : 68;
    const innerX = x + side * rx * 0.2;
    return `M ${onBody(b, top)} A ${rx} ${ry} 0 0 ${side === -1 ? 0 : 1} ${onBody(b, bottom)} L ${innerX} ${y + ry * 0.1} Z`;
  };
  const collarLine = (side: 1 | -1) => (
    <path
      key={`c${side}`}
      d={`M ${onBody(b, side === -1 ? 258 : 282)} L ${x + side * rx * 0.2} ${y + ry * 0.1}`}
      stroke={collar}
      strokeWidth={rx * 0.16}
      strokeLinecap="round"
    />
  );
  const flowers: [number, number][] = [[-0.62, -0.1], [-0.5, 0.45], [0.58, -0.05], [0.66, 0.42], [-0.78, 0.2]];
  return (
    <g>
      <path d={panel(-1)} fill={left} />
      <path d={panel(1)} fill={right} />
      {collarLine(-1)}
      {collarLine(1)}
      {dots && flowers.map(([dx, dy], i) => <circle key={i} cx={x + dx * rx} cy={y + dy * ry} r={rx * 0.06} fill={dots} />)}
    </g>
  );
}

/** Clothes show how far 小福 has grown. Drawn over the body, under the arms and head. */
function outfit(stage: FoxStage, b: Pose["body"]) {
  const { x, y, rx, ry } = b;
  if (stage === 2) {
    // a small vermilion bandana
    return (
      <g>
        <path d={`M ${x - rx * 0.72} ${y - ry * 0.78} L ${x} ${y - ry * 0.7} L ${x} ${y + ry * 0.12} Z`} fill="#cf5b4a" />
        <path d={`M ${x + rx * 0.72} ${y - ry * 0.78} L ${x} ${y - ry * 0.7} L ${x} ${y + ry * 0.12} Z`} fill="#b74a3c" />
      </g>
    );
  }
  if (stage === 3) {
    // a moss-green scarf with one end hanging down
    return (
      <g>
        <ellipse cx={x} cy={y - ry * 0.8} rx={rx * 0.66} ry={ry * 0.2} fill="#7f9874" />
        <path d={`M ${x} ${y - ry * 1.0} A ${rx * 0.66} ${ry * 0.2} 0 0 1 ${x} ${y - ry * 0.6} Z`} fill="#6c8462" />
        <path d={`M ${x + rx * 0.22} ${y - ry * 0.7} L ${x + rx * 0.44} ${y - ry * 0.72} L ${x + rx * 0.42} ${y + ry * 0.05} L ${x + rx * 0.2} ${y} Z`} fill="#6c8462" />
      </g>
    );
  }
  if (stage === 4) return haori(b, "#4d5d7d", "#3f4e6b", "#f4e6cb");
  if (stage === 5) return haori(b, "#e0ad4a", "#cd9a38", "#fbf3e2", "#fbf3e2");
  return null;
}

// --- poses ---

/** Sleeping, curled into a ball with the tail wrapped around (drawn at stage-1 size). */
function curledFox(mood: FoxMood) {
  return (
    <g>
      {ellipse2(108, 150, 50, 32, FUR_L, FUR_R)}
      {/* tail wrapped around the front, cream tip under the chin */}
      <path d="M 156 142 C 170 178 112 192 62 184 C 50 182 44 172 52 166 C 76 176 132 176 148 148 Z" fill={FUR_R} />
      <path d="M 62 184 C 50 182 44 172 52 166 C 60 171 70 174 80 175 C 76 181 70 184 62 184 Z" fill={CREAM_L} />
      {head({ x: 78, y: 138, r: 27 })}
      {face({ x: 78, y: 138, r: 27, mood: mood === "excited" ? "happy" : mood })}
    </g>
  );
}

/** Lying on the belly, chin on the front paws, tail stretched out behind. */
function lyingFox(r: number, mood: FoxMood) {
  const hx = 78;
  const hy = 182 - r;
  return (
    <g>
      <path d="M 130 170 C 152 172 178 166 190 150 C 194 140 188 132 180 136 C 172 150 150 156 128 156 Z" fill={FUR_R} />
      <path d="M 190 150 C 194 140 188 132 180 136 C 180 142 182 147 190 150 Z" fill={CREAM_L} />
      {ellipse2(118, 166, 46, 19, FUR_L, FUR_R)}
      <ellipse cx={144} cy={177} rx={12} ry={7} fill={DARK} />
      {head({ x: hx, y: hy, r })}
      {face({ x: hx, y: hy, r, mood })}
      <ellipse cx={hx - r * 0.42} cy={hy + r * 1.02} rx={r * 0.26} ry={r * 0.13} fill={DARK} />
      <ellipse cx={hx + r * 0.42} cy={hy + r * 1.02} rx={r * 0.26} ry={r * 0.13} fill={DARK} />
    </g>
  );
}

/** The fox in a pose, drawn in the 200×200 box; stage 1 (a baby) is drawn smaller. */
function posedFox(stage: FoxStage, pose: FoxPose, mood: FoxMood) {
  const { head: hd, body: b, tailSize } = POSES[stage === 1 ? 2 : stage];
  const { x, y, rx, ry } = b;
  const s = rx / 32; // prop scale

  if (pose === "sleep") {
    const k = { 1: 0.8, 2: 0.88, 3: 0.95, 4: 1.05, 5: 1.05 }[stage];
    return <g transform={`translate(${100 * (1 - k)} ${186 * (1 - k)}) scale(${k})`}>{curledFox(mood)}</g>;
  }
  if (pose === "lie") return lyingFox(hd.r * 0.9, mood);

  const lift = pose === "jump" ? -16 : 0;
  const shoulder = (side: 1 | -1) => [x + side * rx * 0.55, y - ry * 0.45] as const;

  // Arms drawn behind the head (resting, holding) or in front of it (raised high).
  let armsBehind: ReactNode = null;
  let armsFront: ReactNode = null;
  let props: ReactNode = null;

  if (pose === "sit") {
    // paws together in front, tail curled around the feet
    props = (
      <g>
        {paw(x - rx * 0.13, y + ry * 0.48, rx, 8)}
        {paw(x + rx * 0.13, y + ry * 0.48, rx, -8)}
        {tailAroundFeet(x, y, rx, ry)}
      </g>
    );
  } else if (pose === "wave") {
    // waves with the left paw, away from the tail, so the arm reads clearly
    armsBehind = paw(x + rx * 0.42, y + ry * 0.2, rx, -20);
    armsFront = (
      <g>
        {limb(...shoulder(-1), x - rx * 1.5, y - ry * 1.42, rx * 0.46)}
        <path d={`M ${x - rx * 1.98} ${y - ry * 1.86} q ${-6 * s} ${6 * s} 0 ${12 * s} M ${x - rx * 2.18} ${y - ry * 2.01} q ${-9 * s} ${9 * s} 0 ${18 * s}`} fill="none" stroke={DARK} strokeWidth={1.8 * s} strokeLinecap="round" opacity={0.45} />
      </g>
    );
  } else if (pose === "jump") {
    armsFront = (
      <g>
        {limb(...shoulder(-1), x - rx * 1.2, y - ry * 1.4, rx * 0.48)}
        {limb(...shoulder(1), x + rx * 1.2, y - ry * 1.4, rx * 0.48)}
      </g>
    );
  } else if (pose === "tea") {
    props = (
      <g>
        {teacup(x, y + ry * 0.2, s)}
        {paw(x - rx * 0.36, y + ry * 0.26, rx, 50)}
        {paw(x + rx * 0.36, y + ry * 0.26, rx, -50)}
      </g>
    );
  } else if (pose === "card") {
    props = (
      <g>
        {postcard(x, y - ry * 0.05, s * 1.75)}
        {paw(x - rx * 0.86, y + ry * 0.3, rx, 30)}
        {paw(x + rx * 0.86, y + ry * 0.2, rx, -30)}
      </g>
    );
  } else if (pose === "heart") {
    // arms reach from the shoulders to the sides of the heart
    armsBehind = (
      <g>
        {limb(...shoulder(-1), x - 27 * s, y - ry * 0.08 + 3 * s, rx * 0.44)}
        {limb(...shoulder(1), x + 27 * s, y - ry * 0.08 + 3 * s, rx * 0.44)}
      </g>
    );
    props = (
      <g>
        {heartShape(x, y - ry * 0.08, s * 1.95)}
        {/* paws on the heart's left and right edges, holding it out to you */}
        {paw(x - 27 * s, y - ry * 0.08 + 3 * s, rx, 25)}
        {paw(x + 27 * s, y - ry * 0.08 + 3 * s, rx, -25)}
      </g>
    );
  } else if (pose === "flower") {
    props = (
      <g>
        {osmanthusSprig(x - rx * 0.18, y + ry * 0.12, hd.x - hd.r * 0.45, hd.y + hd.r * 0.72, s)}
        {paw(x - rx * 0.3, y + ry * 0.08, rx, 30)}
        {paw(x - rx * 0.06, y - ry * 0.06, rx, -30)}
      </g>
    );
  } else if (pose === "cheeks") {
    armsFront = (
      <g>
        {limb(...shoulder(-1), hd.x - hd.r * 0.66, hd.y + hd.r * 0.42, rx * 0.5)}
        {limb(...shoulder(1), hd.x + hd.r * 0.66, hd.y + hd.r * 0.42, rx * 0.5)}
      </g>
    );
  } else if (pose === "tilt") {
    armsBehind = (
      <g>
        {paw(x - rx * 0.42, y + ry * 0.2, rx, 20)}
        {paw(x + rx * 0.42, y + ry * 0.2, rx, -20)}
      </g>
    );
  } else if (pose === "explore") {
    // one paw holding a backpack strap, ready to go
    armsBehind = (
      <g>
        {backpackStraps(b)}
        {paw(x - rx * 0.46, y - ry * 0.12, rx, 10)}
        {paw(x + rx * 0.42, y + ry * 0.2, rx, -20)}
      </g>
    );
  }

  // A head tilt (degrees) makes most poses feel alive; rotate the head around the neck.
  const tiltDeg = { tilt: -16, sit: -7, wave: -6, flower: -8 }[pose as string] ?? 0;
  const tilt = tiltDeg ? `rotate(${tiltDeg} ${hd.x} ${hd.y + hd.r * 0.9})` : undefined;

  const fox = (
    <g transform={`translate(0 ${lift})`}>
      {pose !== "sit" && tail({ x: x + rx * 0.62, y: y + ry * 0.6, s: tailSize })}
      {pose === "explore" && backpackBack(b)}
      {body(b, pose === "jump")}
      {outfit(stage, b)}
      {armsBehind}
      <g transform={tilt}>
        {/* inner group: the idle head sway, separate from the pose's tilt */}
        <g className="fox-head">
          {head(hd)}
          {face({ ...hd, mood })}
        </g>
      </g>
      {props}
      {armsFront}
    </g>
  );
  return stage === 1 ? <g transform="translate(25 46.5) scale(0.75)">{fox}</g> : fox;
}

export default function Fox({
  stage,
  pose = "sit",
  mood,
  size = 200,
  animated = false,
}: {
  stage: FoxStage;
  pose?: FoxPose;
  /** Defaults to the expression that suits the pose. */
  mood?: FoxMood;
  size?: number;
  /** Gentle idle motion: breathing, blinking, a swaying tail. */
  animated?: boolean;
}) {
  const m = mood ?? DEFAULT_MOOD[pose];
  const motion = pose === "jump" ? " fox-hop" : pose === "sleep" ? " fox-slow" : "";
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={animated ? "fox-alive" : undefined}
      aria-label={`小福（${STAGE_NAMES[stage]}・${POSE_NAMES[pose]}）`}
    >
      {stage === 5 && <circle cx={100} cy={112} r={86} fill={FLOWER} opacity={0.14} />}
      <ellipse cx={100} cy={186} rx={pose === "jump" ? 34 : 50} ry={pose === "jump" ? 4 : 6} fill={INK} opacity={0.08} />
      <g className={`fox-body${motion}`}>{posedFox(stage, pose, m)}</g>
    </svg>
  );
}
