// Downloads tiny font files for the share preview image (src/app/opengraph-image.tsx).
//
// Full Chinese fonts are 10MB+, too big for image generation, so this asks Google Fonts
// for only the characters the image uses. Re-run after changing any text in that file:
//
//   node scripts/og-fonts.mjs

import fs from "node:fs";

const SOURCE = "src/app/opengraph-image.tsx";
const OUT_DIR = "assets/og";
const source = fs.readFileSync(SOURCE, "utf8");

// Serif: every non-ASCII character in the file, plus printable ASCII for Latin text.
const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");
const serifText = [...new Set([...source].filter((c) => c.charCodeAt(0) > 127).concat([...ascii]))].join("");

// Brush: only the characters in BRUSH_TEXT.
const brushText = source.match(/const BRUSH_TEXT = "([^"]+)"/)?.[1];
if (!brushText) throw new Error(`BRUSH_TEXT not found in ${SOURCE}`);

async function download(family, text, file) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)).text();
  const url = css.match(/src: url\(([^)]+)\) format\('truetype'\)/)?.[1];
  if (!url) throw new Error(`No TrueType font returned for ${family}:\n${css.slice(0, 300)}`);
  const font = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(`${OUT_DIR}/${file}`, font);
  console.log(`${file.padEnd(10)} ${[...text].length} chars  ${(font.length / 1024).toFixed(1)} KB`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
await download("Noto+Serif+TC", serifText, "serif.ttf");
await download("Ma+Shan+Zheng", brushText, "brush.ttf");
