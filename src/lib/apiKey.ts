// Bring-your-own-key helpers shared by the browser and the server.
// No AI SDK imports here, so the browser bundle stays small.
import { canEncrypt, decrypt, encrypt } from "./keyVault";
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

// --- browser only ---
//
// "remember": encrypted (see keyVault.ts) in localStorage, kept until removed.
// "session": encrypted in sessionStorage, gone when the tab is closed.
// Without Web Crypto (plain http on a LAN address), only "session" is offered, stored unencrypted.
// The decrypted key is kept in memory for this page only.

export type KeyMode = "remember" | "session";

const REMEMBERED = "aiKeySealed"; // localStorage, via storage.ts
const SESSION = "happiness:aiKeySession"; // sessionStorage
const LEGACY = "aiKey"; // plaintext, before encryption existed

let current: { key: string; mode: KeyMode } | null = null;
let loading: Promise<void> | null = null;

function session() {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

async function readStored(): Promise<{ key: string; mode: KeyMode } | null> {
  // An unencrypted key saved by an older version: encrypt it and drop the plaintext.
  const legacy = load<string>(LEGACY);
  if (legacy) {
    remove(LEGACY);
    if (detectProvider(legacy)) return writeStored(legacy, "remember");
  }
  const sealed = load<string>(REMEMBERED);
  if (sealed) {
    const key = await decrypt(sealed);
    if (key) return { key, mode: "remember" };
    remove(REMEMBERED); // can't be decrypted any more (site data partly cleared)
  }
  const inSession = session()?.getItem(SESSION);
  if (inSession) {
    const key = canEncrypt() ? await decrypt(inSession) : inSession;
    if (key) return { key, mode: "session" };
    session()?.removeItem(SESSION);
  }
  return null;
}

async function writeStored(key: string, mode: KeyMode): Promise<{ key: string; mode: KeyMode }> {
  remove(REMEMBERED);
  session()?.removeItem(SESSION);
  if (!canEncrypt()) {
    session()?.setItem(SESSION, key);
    return { key, mode: "session" };
  }
  const sealed = await encrypt(key);
  if (mode === "remember") save(REMEMBERED, sealed);
  else session()?.setItem(SESSION, sealed);
  return { key, mode };
}

/** Reads (and decrypts) the stored key once per page. Safe to call many times. */
export function loadApiKey(): Promise<void> {
  loading ??= readStored()
    .then((stored) => {
      current = stored;
    })
    .catch(() => {
      current = null;
    });
  return loading;
}

/** The key, once loadApiKey() has finished; null before that or when none is set. */
export function getApiKey(): string | null {
  return current?.key ?? null;
}

export function getKeyMode(): KeyMode | null {
  return current?.mode ?? null;
}

/** Whether the key can be remembered (encrypted) in this browser. */
export function canRememberKey() {
  return canEncrypt();
}

/** Saves the key; resolves with how it was actually kept. */
export async function setApiKey(key: string, mode: KeyMode): Promise<KeyMode> {
  await loadApiKey();
  current = await writeStored(key, mode);
  return current.mode;
}

export async function clearApiKey() {
  await loadApiKey();
  remove(REMEMBERED);
  remove(LEGACY);
  session()?.removeItem(SESSION);
  current = null;
}

/** Headers to add to /api requests so the server can call AI with the visitor's key. */
export async function aiHeaders(): Promise<Record<string, string>> {
  await loadApiKey();
  const key = getApiKey();
  return key ? { [KEY_HEADER]: key } : {};
}
