// Log AI call failures without the error message: provider "invalid key" messages
// can echo part of the visitor's key, and their keys must never end up in logs.
export function logAiError(route: string, error: unknown) {
  const name = error instanceof Error ? error.name : typeof error;
  const status = (error as { status?: unknown })?.status;
  console.error(`[${route}] AI call failed: ${name}${typeof status === "number" ? ` (HTTP ${status})` : ""}`);
}
