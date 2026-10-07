import { z } from "zod";
import { generateWeekly, keyProblemOf, resolveAuth } from "@/lib/ai";
import { fallbackWeekly } from "@/lib/fallback";
import { LIMITS } from "@/lib/limits";
import { logAiError } from "@/lib/logAiError";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

const Entry = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  goodThings: z.array(z.string().max(LIMITS.goodThing)).max(3),
  reflection: z.string().max(LIMITS.reflection).optional(),
  task: z.string().max(LIMITS.task).optional(),
});

const Body = z.object({
  /** The past week's journal entries (at most 7 days). */
  entries: z.array(Entry).min(1).max(7),
  foxName: z.string().trim().max(12).optional(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const { entries } = parsed.data;
  const foxName = parsed.data.foxName || undefined;

  const wait = rateLimit(`weekly:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (wait) return tooManyRequests(wait);

  // No key from the visitor or the server: a built-in letter that still quotes the entries.
  const auth = resolveAuth(request);
  if (!auth) return Response.json({ ...fallbackWeekly(entries), source: "local" });

  try {
    const weekly = await generateWeekly({ entries, foxName }, auth);
    return Response.json({ ...weekly, source: "ai" });
  } catch (error) {
    logAiError("api/weekly", error);
    return Response.json({ ...fallbackWeekly(entries), source: "local", keyProblem: keyProblemOf(error) });
  }
}
