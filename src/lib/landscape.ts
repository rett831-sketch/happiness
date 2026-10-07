// Shared helpers for drawing soft, generated landscapes in SVG.

/** Deterministic random number generator: the same seed always gives the same sequence. */
export function seededRandom(seed: string) {
  let h = 1779033703;
  for (const ch of seed) h = Math.imul(h ^ ch.codePointAt(0)!, 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * A closed SVG path for a mountain ridge: a wavy line at about `base` height
 * (sum of a few sine waves), filled down to `bottom`.
 */
export function ridgePath(
  rand: () => number,
  { width, base, bottom, amplitude }: { width: number; base: number; bottom: number; amplitude: number },
) {
  const waves = Array.from({ length: 3 }, (_, i) => ({
    amp: amplitude / (i + 1),
    freq: (0.6 + rand() * 1.2) * (i + 1) * ((Math.PI * 2) / width),
    phase: rand() * Math.PI * 2,
  }));
  const step = width / 40;
  let d = `M0 ${bottom}`;
  for (let x = 0; x <= width + 0.01; x += step) {
    const wave = waves.reduce((sum, w) => sum + w.amp * Math.sin(x * w.freq + w.phase), 0);
    const y = Math.min(base + wave, bottom); // never dip below the fill line (e.g. a lake shore)
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L${width} ${bottom} Z`;
}

/** Approximate y of a ridge line at `x` (nearest sampled point), for placing trees on it. */
export function ridgeY(path: string, x: number) {
  const points = [...path.matchAll(/L([\d.]+) ([\d.-]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  let best = points[0];
  for (const p of points) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  return best[1];
}
