// Fixed-window, in-memory rate limiter keyed by client IP.
// Note: memory is per server process, so on multi-instance / serverless hosting each
// instance counts separately. Swap in a shared store (e.g. Redis) before scaling out.

const hits = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

/** Returns seconds to wait if the limit is exceeded, or 0 if the request is allowed. */
export function rateLimit(key: string, limit: number, windowMs: number): number {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return 0;
  }
  if (entry.count >= limit) return Math.ceil((entry.resetAt - now) / 1000);
  entry.count++;
  return 0;
}

/**
 * Requests per IP per hour. The tight limit protects the site's own AI key. Visitors using their
 * own key, or the built-in content, only get a loose flood guard: a classroom shares one IP,
 * and a whole class trying the app at once must not lock each other out.
 */
export function hourlyLimit(auth: { site?: boolean } | null) {
  return auth?.site ? 10 : 200;
}

export function tooManyRequests(retryAfter: number) {
  return Response.json(
    { error: "rate_limited", message: "今天已經用很多次囉，休息一下再回來吧。" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
