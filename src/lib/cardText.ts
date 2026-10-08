/**
 * The card written at night is read the next morning, so "明早" (tomorrow morning) in it is wrong by then.
 * Rewrites it to "今天" (the AI is asked not to use it; this catches the slips). Plain "明天" is left
 * alone, since cards like 「寫一張小紙條給明天的自己」 mean it.
 */
export function asReadNextMorning<T extends { title: string; task: string; hint: string }>(card: T): T {
  const fix = (s: string) => s.replace(/明天早上|明天一早|明日早上|明早/g, "今天");
  return { ...card, title: fix(card.title), task: fix(card.task), hint: fix(card.hint) };
}
