import type { MetadataRoute } from "next";

// Lets people add the app to their phone's home screen and open it full screen.
// Icon URLs come from app/icon.tsx (one per id in generateImageMetadata).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "happiness 幸福小練習",
    short_name: "幸福",
    description: "每天兩次的幸福小練習：早晨翻開一張任務卡，夜晚寫下三件好事。",
    lang: "zh-Hant",
    start_url: "/",
    display: "standalone",
    background_color: "#f2ecdc",
    theme_color: "#f2ecdc",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
