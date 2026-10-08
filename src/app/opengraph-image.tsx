import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BranchDrawing } from "@/components/Branch";
import Fox from "@/components/Fox";
import { ridgePath, seededRandom } from "@/lib/landscape";

// Share preview shown by LINE, Facebook, Messenger, etc.: the title on the left, and 小福
// holding the morning card on the right. The font in assets/og contains only the characters
// used below. After changing any text here, run `node scripts/og-fonts.mjs` to re-download it.

export const alt = "幸福練習課：小狐狸小福陪你練習幸福，早晨帶來一張任務卡，夜晚聽你說三件好事";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const serif = await readFile(join(process.cwd(), "assets/og/serif.ttf"));

const INK = "#3b3a32";
const INK_SOFT = "#6e6a5c";
const MOSS = "#6f8a6a";
const SEAL = "#b4473a";

const rand = seededRandom("og-a");
const HILLS = [0, 1, 2].map((i) => ridgePath(rand, { width: 1200, base: 70 + i * 50, bottom: 240, amplitude: 26 - i * 5 }));

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundImage: "linear-gradient(to bottom, #f4efe2, #f2ecdc 60%, #ede6d2)",
          fontFamily: "Serif",
          color: INK,
        }}
      >
        {/* morning sun behind the fox (fades to the same color at zero alpha; black would look grey) */}
        <div
          style={{
            position: "absolute",
            left: 570,
            top: -240,
            width: 720,
            height: 720,
            borderRadius: 9999,
            backgroundImage: "radial-gradient(circle, rgba(247,227,184,0.95), rgba(247,227,184,0) 70%)",
          }}
        />

        <svg width={1200} height={240} viewBox="0 0 1200 240" style={{ position: "absolute", left: 0, bottom: 0 }}>
          <path d={HILLS[0]} fill="#dfe0c9" />
          <path d={HILLS[1]} fill="#c8d0b2" />
          <path d={HILLS[2]} fill="#adbd9b" />
        </svg>

        <div style={{ position: "absolute", right: 10, top: -20, display: "flex" }}>
          <BranchDrawing width={150} height={248} />
        </div>

        {/* 小福 (少年狐, in its scarf) holding today's card */}
        <div style={{ position: "absolute", left: 650, top: 150, display: "flex" }}>{Fox({ stage: 3, pose: "card", size: 440 })}</div>

        <div style={{ position: "absolute", left: 96, top: 118, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, letterSpacing: 8, color: MOSS }}>每天兩次的小練習</div>
          <div style={{ marginTop: 12, fontSize: 104, letterSpacing: 12 }}>幸福練習課</div>
          <div style={{ marginTop: 26, fontSize: 38, letterSpacing: 4 }}>小狐狸小福，陪你練習幸福</div>
          <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 10, fontSize: 28, color: INK_SOFT, letterSpacing: 3 }}>
            <span>早晨，牠帶來一張任務卡</span>
            <span>夜晚，聽你說三件好事</span>
          </div>
        </div>

        {/* seal beside the title */}
        <div
          style={{
            position: "absolute",
            left: 590,
            top: 128,
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
          <span>小</span>
          <span>福</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Serif", data: serif, style: "normal", weight: 400 }],
    },
  );
}
