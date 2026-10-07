import type { Echo, TaskCard } from "./ai";
import { pickCard } from "./cardLibrary";
import type { Sky } from "./weather";

// Used when there's no AI key or the AI call fails, so the flow still works.

/** "2026-10-07" → "2026-10-08" */
function nextDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** Today's card from the built-in library (see cardLibrary.ts). */
export function fallbackCard(date: string, sky?: Sky): TaskCard {
  return pickCard({ date, sky });
}

/** A gentle reply (in the fox's voice when it has a name), plus tomorrow's card from the library. */
export function fallbackEcho(goodThings: string[], date: string, foxName?: string): Echo {
  const first = goodThings.find(Boolean);
  const reply = foxName
    ? first
      ? `謝謝你告訴我「${first}」！聽完我也覺得暖暖的。願意在一天結束時回頭看見美好，你真的很棒。今晚好好休息，我要帶著它出門探險囉。`
      : "謝謝你今晚回來陪我。就算今天平淡或辛苦，願意停下來回顧，就是在好好照顧自己。今晚好好休息，明早見。"
    : first
      ? `謝謝你記下「${first}」。願意在一天結束時回頭看見美好，本身就是一種很珍貴的能力。今晚好好休息，你今天已經做得很好了。`
      : "謝謝你今晚回來這裡。就算今天平淡或辛苦，願意停下來回顧，就是在好好照顧自己。今晚好好休息。";
  return {
    reply,
    tomorrowCard: pickCard({ date: nextDay(date) }),
  };
}
