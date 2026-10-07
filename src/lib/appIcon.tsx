import { ImageResponse } from "next/og";
import { ridgePath, seededRandom } from "@/lib/landscape";

// App icon: a task card, tilted on rice paper, showing a small landscape like the card backs in the app.
// Flat colors and few shapes so it still reads at 32px.

const PAPER = "#f2ecdc";
const CARD = "#faf6ea";

// The card's picture, drawn in a 100×130 box.
const rand = seededRandom("app-icon");
const RIDGES = [0, 1, 2].map((i) => ridgePath(rand, { width: 100, base: 72 + i * 16, bottom: 130, amplitude: 7 - i }));
const RIDGE_COLORS = ["#c9d1b5", "#a9b99a", "#7f9874"];

/**
 * @param size  icon width/height in px
 * @param cardScale  card height relative to the icon; smaller for "maskable" icons,
 *   which Android may crop to a circle (content must stay inside the middle ~80%).
 */
export function renderAppIcon(size: number, cardScale = 0.8) {
  const cardH = size * cardScale;
  const cardW = cardH * 0.76;
  const border = Math.max(1, cardW * 0.07); // the card's cream margin around the picture
  const artW = cardW - border * 2;
  const artH = cardH - border * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: PAPER,
        }}
      >
        <div
          style={{
            width: cardW,
            height: cardH,
            display: "flex",
            padding: border,
            backgroundColor: CARD,
            borderRadius: cardW * 0.06,
            transform: "rotate(-6deg)",
            boxShadow: `0 ${size * 0.03}px ${size * 0.06}px rgba(59, 58, 50, 0.28)`,
          }}
        >
          <svg width={artW} height={artH} viewBox="0 0 100 130" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f4e6cf" />
                <stop offset="1" stopColor="#eef0e2" />
              </linearGradient>
            </defs>
            <rect width="100" height="130" fill="url(#sky)" />
            <circle cx="66" cy="44" r="15" fill="#e2b54a" />
            {RIDGES.map((d, i) => (
              <path key={i} d={d} fill={RIDGE_COLORS[i]} />
            ))}
          </svg>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
