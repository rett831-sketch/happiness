// Small localStorage wrapper: every read/write is guarded so private mode or blocked storage never breaks the page.

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateKey(d);
}

export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`happiness:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(`happiness:${key}`, JSON.stringify(value));
  } catch {
    // ignore: storage unavailable
  }
}
