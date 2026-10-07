import { generateEcho } from "@/lib/ai";
import { fallbackEcho } from "@/lib/fallback";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    task?: string;
    reflection?: string;
    goodThings?: string[];
  };
  const goodThings = (body.goodThings ?? []).map((t) => t.trim()).slice(0, 3);
  try {
    const echo = await generateEcho({ task: body.task, reflection: body.reflection?.trim(), goodThings });
    return Response.json({ ...echo, source: "ai" });
  } catch (error) {
    console.error("[api/echo]", error);
    return Response.json({ ...fallbackEcho(goodThings), source: "local" });
  }
}
