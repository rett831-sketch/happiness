// Bring-your-own-key helpers shared by the browser and the server.
// No AI SDK imports here, so the browser bundle stays small.
import { load, remove, save } from "./storage";

export type Provider = "anthropic" | "openai";

export const PROVIDER_NAMES: Record<Provider, string> = {
  anthropic: "Claude（Anthropic）",
  openai: "OpenAI",
};

/** Request header the browser uses to send the visitor's own key. Never stored or logged on the server. */
export const KEY_HEADER = "x-ai-key";

/** Anthropic keys start with sk-ant-; other sk- keys are OpenAI. */
export function detectProvider(key: string): Provider | null {
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("sk-")) return "openai";
  return null;
}

/** sk-proj-…wxyz: enough to recognise a key without showing it. */
export function maskKey(key: string) {
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

// --- browser only: the key lives in this browser's localStorage ---

export function getApiKey(): string | null {
  return load<string>("aiKey");
}

export function setApiKey(key: string) {
  save("aiKey", key);
}

export function clearApiKey() {
  remove("aiKey");
}

/** Headers to add to /api requests so the server can call AI with the visitor's key. */
export function aiHeaders(): Record<string, string> {
  const key = getApiKey();
  return key ? { [KEY_HEADER]: key } : {};
}
