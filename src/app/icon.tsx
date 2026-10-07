import { renderAppIcon } from "@/lib/appIcon";

// Browser tab icon plus the Android home-screen sizes referenced by app/manifest.ts.
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
    { id: "maskable", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const iconId = await id;
  if (iconId === "maskable") return renderAppIcon(512, 0.6); // extra margin for circular crops
  return renderAppIcon(Number(iconId));
}
