import { z } from "zod";
import { generateTaskCard, keyProblemOf, resolveAuth } from "@/lib/ai";
import { fallbackCard } from "@/lib/fallback";
import { logAiError } from "@/lib/logAiError";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { describeWeather, weatherFor } from "@/lib/weather";

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

const Body = z.object({
  weekdayIndex: z.number().int().min(0).max(6),
  /** The visitor's day ("YYYY-MM-DD", starting at 05:00 local time); picks the built-in card. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const { weekdayIndex } = parsed.data;
  const date = parsed.data.date ?? new Date().toISOString().slice(0, 10);

  // A card is normally drawn once a day; leave room for retries.
  const wait = rateLimit(`card:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (wait) return tooManyRequests(wait);

  // Approximate location from Vercel's IP headers, so the browser never asks for permission.
  // Used by both the AI prompt and the built-in library (e.g. no outdoor tasks when it rains).
  const weather = await weatherFor(request);

  // No key from the visitor or the server: use a built-in card.
  const auth = resolveAuth(request);
  if (!auth) return Response.json({ card: fallbackCard(date, weather?.sky), source: "local" });

  try {
    const card = await generateTaskCard(
      { weekday: WEEKDAYS[weekdayIndex], weather: weather && describeWeather(weather) },
      auth,
    );
    return Response.json({ card, source: "ai" });
  } catch (error) {
    logAiError("api/card", error);
    return Response.json({ card: fallbackCard(date, weather?.sky), source: "local", keyProblem: keyProblemOf(error) });
  }
}
