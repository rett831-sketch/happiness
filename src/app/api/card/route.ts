import { z } from "zod";
import { aiEnabled, generateTaskCard } from "@/lib/ai";
import { fallbackCard } from "@/lib/fallback";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { weatherFor } from "@/lib/weather";

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

const Body = z.object({
  weekdayIndex: z.number().int().min(0).max(6),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const { weekdayIndex } = parsed.data;

  // A card is normally drawn once a day; leave room for retries.
  const wait = rateLimit(`card:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (wait) return tooManyRequests(wait);

  if (!aiEnabled) return Response.json({ card: fallbackCard(weekdayIndex), source: "local" });

  try {
    // Approximate location from Vercel's IP headers, so the browser never asks for permission.
    const weather = await weatherFor(request);
    const card = await generateTaskCard({ weekday: WEEKDAYS[weekdayIndex], weather });
    return Response.json({ card, source: "ai" });
  } catch (error) {
    console.error("[api/card]", error);
    return Response.json({ card: fallbackCard(weekdayIndex), source: "local" });
  }
}
