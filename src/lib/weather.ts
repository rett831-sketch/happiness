// Server-side weather lookup from the visitor's approximate (IP-based) location.
// Vercel adds the coordinates as request headers, so the browser never asks for
// location permission. Locally those headers are absent and this returns undefined.

export type Sky = "晴朗" | "多雲" | "有霧" | "下雨" | "下雪" | "雷雨";
export type Weather = { sky: Sky; temp: number };

// Open-Meteo WMO weather codes → sky.
function skyFor(code: number): Sky {
  return code === 0 ? "晴朗" :
    code <= 3 ? "多雲" :
    code <= 48 ? "有霧" :
    code <= 67 || (code >= 80 && code <= 82) ? "下雨" :
    code <= 77 || code === 85 || code === 86 ? "下雪" :
    "雷雨";
}

/** e.g. "下雨，18°C" — for the AI prompt. */
export function describeWeather(w: Weather) {
  return `${w.sky}，${Math.round(w.temp)}°C`;
}

/** Current weather near the visitor, or undefined when the location or weather service is unavailable. */
export async function weatherFor(request: Request): Promise<Weather | undefined> {
  const rawLat = request.headers.get("x-vercel-ip-latitude");
  const rawLon = request.headers.get("x-vercel-ip-longitude");
  if (!rawLat || !rawLon) return undefined;
  const lat = Number(rawLat);
  const lon = Number(rawLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
      { signal: AbortSignal.timeout(3000) }, // weather is a nice-to-have; don't hold up the card
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { current?: { weather_code: number; temperature_2m: number } };
    return data.current ? { sky: skyFor(data.current.weather_code), temp: data.current.temperature_2m } : undefined;
  } catch {
    return undefined;
  }
}
