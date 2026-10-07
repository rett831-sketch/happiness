import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BranchDrawing } from "@/components/Branch";
import { ridgePath, seededRandom } from "@/lib/landscape";

// Share preview shown by LINE, Facebook, Messenger, etc.
// The fonts in assets/og contain only the characters used below. After changing
// any text here, run `node scripts/og-fonts.mjs` to re-download them.

export const alt = "happiness 幸福小練習：早晨翻開一張任務卡，夜晚寫下三件好事";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRUSH_TEXT = "晨"; // drawn with the brush font; read by scripts/og-fonts.mjs

const [serif, brush] = await Promise.all([
  readFile(join(process.cwd(), "assets/og/serif.ttf")),
  readFile(join(process.cwd(), "assets/og/brush.ttf")),
]);

const INK = "#3b3a32";
const INK_SOFT = "#6e6a5c";
const MOSS = "#6f8a6a";
const SEAL = "#b4473a";

const rand = seededRandom("og-hills");
const HILLS = [0, 1, 2].map((i) => ridgePath(rand, { width: 1200, base: 70 + i * 50, bottom: 240, amplitude: 26 - i * 5 }));

/** Characters stacked top to bottom (Satori has no vertical writing mode). */
function Vertical({ text, fontSize, color }: { text: string; fontSize: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize, color, lineHeight: 1.35 }}>
      {[...text].map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#f2ecdc",
          backgroundImage: "linear-gradient(to bottom, #f4efe2, #f2ecdc 60%, #ede6d2)",
          fontFamily: "Serif",
          color: INK,
        }}
      >
        {/* morning glow */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -160,
            width: 620,
            height: 620,
            borderRadius: 9999,
            backgroundImage: "radial-gradient(circle, rgba(247,227,184,0.9), rgba(247,227,184,0) 70%)",
          }}
        />

        {/* bamboo blind: reeds and two ties */}
        <svg width={340} height={470} viewBox="0 0 340 470" style={{ position: "absolute", left: 80, top: 56 }}>
          <rect width="340" height="470" fill="#e6dfc6" opacity="0.8" />
          {Array.from({ length: 57 }, (_, i) => (
            <rect key={i} x={i * 6} width="2" height="470" fill="#ffffff" opacity="0.45" />
          ))}
          <rect y="84" width="340" height="2" fill="#ffffff" opacity="0.7" />
          <rect y="292" width="340" height="2" fill="#ffffff" opacity="0.7" />
        </svg>

        {/* hills, in front of the blind's lower edge */}
        <svg width={1200} height={240} viewBox="0 0 1200 240" style={{ position: "absolute", left: 0, bottom: 0 }}>
          <path d={HILLS[0]} fill="#dfe0c9" />
          <path d={HILLS[1]} fill="#c8d0b2" />
          <path d={HILLS[2]} fill="#adbd9b" />
        </svg>

        {/* large brush character, couplet and seal on the blind */}
        <div style={{ position: "absolute", left: 110, top: 110, display: "flex", alignItems: "flex-start", gap: 26 }}>
          <div style={{ display: "flex", fontFamily: "Brush", fontSize: 210, lineHeight: 1 }}>{BRUSH_TEXT}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 6 }}>
            <Vertical text="慢慢醒來" fontSize={28} color={INK} />
            <Vertical text="晨光微涼" fontSize={28} color={INK} />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 136,
            top: 360,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "6px 5px",
            backgroundColor: SEAL,
            color: "#f7efe2",
            fontSize: 22,
            lineHeight: 1.15,
            borderRadius: 3,
            transform: "rotate(-3deg)",
          }}
        >
          <span>幸</span>
          <span>福</span>
        </div>

        {/* hanging branch */}
        <div style={{ position: "absolute", right: 24, top: -18, display: "flex" }}>
          <BranchDrawing width={180} height={297} />
        </div>

        {/* title and the two daily moments */}
        <div style={{ position: "absolute", left: 500, top: 150, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, letterSpacing: 8, color: MOSS }}>happiness</div>
          <div style={{ marginTop: 10, fontSize: 92, letterSpacing: 10 }}>幸福小練習</div>
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14, fontSize: 32, color: INK_SOFT, letterSpacing: 3 }}>
            <span>早晨，翻開一張任務卡</span>
            <span>夜晚，寫下三件好事</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Serif", data: serif, style: "normal", weight: 400 },
        { name: "Brush", data: brush, style: "normal", weight: 400 },
      ],
    },
  );
}
