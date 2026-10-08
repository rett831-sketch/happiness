// Encrypts the visitor's AI key before it is written to browser storage (browser only).
//
// An AES-GCM key is generated once in this browser as non-extractable: scripts can ask the browser
// to encrypt or decrypt with it, but can never read the key itself. It is kept in IndexedDB (which
// can store a CryptoKey as is); only the ciphertext goes to localStorage / sessionStorage.
//
// What this protects: someone browsing the storage (dev tools, an export or backup of the site's
// data) sees ciphertext, not sk-…. What it cannot protect: a script running inside this page could
// still ask for a decryption, which is why the site also sends a strict Content-Security-Policy.

const DB_NAME = "happiness";
const STORE = "keys";
const KEY_ID = "aiKeyCipher";

/** Web Crypto needs a secure context (https or localhost); a phone on http://192.168.x.x has none. */
export function canEncrypt() {
  return typeof crypto !== "undefined" && !!crypto.subtle && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function request<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** This browser's encryption key; created on first use when `create` is set. */
async function cipherKey(create: boolean): Promise<CryptoKey | null> {
  const db = await openDb();
  try {
    const existing = await request<CryptoKey | undefined>(db, "readonly", (s) => s.get(KEY_ID));
    if (existing || !create) return existing ?? null;
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await request(db, "readwrite", (s) => s.put(key, KEY_ID));
    return key;
  } finally {
    db.close();
  }
}

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

/** "iv.ciphertext", both base64. A fresh random IV for every encryption, as AES-GCM requires. */
export async function encrypt(plain: string): Promise<string> {
  const key = await cipherKey(true);
  if (!key) throw new Error("no key");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return `${toBase64(iv)}.${toBase64(new Uint8Array(data))}`;
}

/** Null when it can't be decrypted (the key was cleared, or the data was changed). */
export async function decrypt(sealed: string): Promise<string | null> {
  try {
    const key = await cipherKey(false);
    const [iv, data] = sealed.split(".");
    if (!key || !iv || !data) return null;
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(iv) }, key, fromBase64(data));
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
