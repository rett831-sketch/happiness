import { z } from "zod";
import { aiEnabled, streamEcho, type Echo, type EchoEvent } from "@/lib/ai";
import { fallbackEcho } from "@/lib/fallback";
import { LIMITS } from "@/lib/limits";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

const Body = z.object({
  task: z.string().max(LIMITS.task).optional(),
  reflection: z.string().max(LIMITS.reflection).optional(),
  goodThings: z.array(z.string().max(LIMITS.goodThing)).max(3).optional(),
});

/** One JSON object per line: `delta` / `reset` while the reply is written, then a final `done`. */
export type EchoStreamLine = EchoEvent | { type: "done"; echo: Echo; source: "ai" | "local" };

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const goodThings = (parsed.data.goodThings ?? []).map((t) => t.trim());
  const reflection = parsed.data.reflection?.trim();
  if (!reflection && !goodThings.some(Boolean)) {
    return Response.json({ error: "empty" }, { status: 400 });
  }

  // Journaling is once a night; leave room for retries.
  const wait = rateLimit(`echo:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (wait) return tooManyRequests(wait);

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (line: EchoStreamLine) => controller.enqueue(encoder.encode(JSON.stringify(line) + "\n"));
      if (!aiEnabled) {
        send({ type: "done", echo: fallbackEcho(goodThings), source: "local" });
        controller.close();
        return;
      }
      let streamed = false;
      try {
        const echo = await streamEcho({ task: parsed.data.task, reflection, goodThings }, (event) => {
          streamed = true;
          send(event);
        });
        send({ type: "done", echo, source: "ai" });
      } catch (error) {
        console.error("[api/echo]", error);
        if (streamed) send({ type: "reset" });
        send({ type: "done", echo: fallbackEcho(goodThings), source: "local" });
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
