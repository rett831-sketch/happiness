import { generateTaskCard } from "@/lib/ai";
import { fallbackCard } from "@/lib/fallback";

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

export async function POST(request: Request) {
  const { weekdayIndex, weather } = (await request.json()) as {
    weekdayIndex: number;
    weather?: string;
  };
  try {
    const card = await generateTaskCard({ weekday: WEEKDAYS[weekdayIndex] ?? "", weather });
    return Response.json({ card, source: "ai" });
  } catch (error) {
    console.error("[api/card]", error);
    return Response.json({ card: fallbackCard(weekdayIndex), source: "local" });
  }
}
