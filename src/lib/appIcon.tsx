import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// App icon: the brush character 晨 in cream on a vermilion seal, like the seal used in the app.
// The brush font in assets/og only contains 晨 (see scripts/og-fonts.mjs).
const brush = await readFile(join(process.cwd(), "assets/og/brush.ttf"));

const SEAL = "#b4473a";
const CREAM = "#f7efe2";

/**
 * @param size  icon width/height in px
 * @param glyphScale  character size relative to the icon; smaller for "maskable" icons,
 *   which Android may crop to a circle (content must stay inside the middle ~80%).
 */
export function renderAppIcon(size: number, glyphScale = 0.74) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: SEAL,
          color: CREAM,
          fontFamily: "Brush",
          fontSize: size * glyphScale,
          lineHeight: 1,
          // the brush glyph sits a little high in its em box
          paddingTop: size * 0.04,
        }}
      >
        晨
      </div>
    ),
    { width: size, height: size, fonts: [{ name: "Brush", data: brush, style: "normal", weight: 400 }] },
  );
}
