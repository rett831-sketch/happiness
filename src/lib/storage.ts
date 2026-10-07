// Small localStorage wrapper: every read/write is guarded so private mode or blocked storage never breaks the page.

const PREFIX = "happiness:";

// A "day" starts at 05:00, so journaling at 00:30 still belongs to the previous evening.
export const DAY_START_HOUR = 5;

/** Date of the current logical day (local time shifted back by DAY_START_HOUR). */
export function logicalDate(now = new Date()) {
  const d = new Date(now);
  d.setHours(d.getHours() - DAY_START_HOUR);
  return d;
}

function format(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateKey() {
  return format(logicalDate());
}

export function tomorrowKey() {
  const d = logicalDate();
  d.setDate(d.getDate() + 1);
  return format(d);
}

export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore: storage unavailable
  }
}

/** All stored values whose key starts with `group:`, as [date, value] pairs, newest first. */
export function loadAll<T>(group: string): [string, T][] {
  const out: [string, T][] = [];
  try {
    const prefix = `${PREFIX}${group}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const value = load<T>(key.slice(PREFIX.length));
      if (value) out.push([key.slice(prefix.length), value]);
    }
  } catch {
    // ignore: storage unavailable
  }
  return out.sort((a, b) => b[0].localeCompare(a[0]));
}
