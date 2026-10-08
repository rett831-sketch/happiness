/**
 * The card written at night is read the next morning, so "明早 / 明天" in it is always wrong by then.
 * Rewrites them to "今天" (the AI is asked not to use them, this catches the slips).
 */
export function asReadNextMorning<T extends { title: string; task: string; hint: string }>(card: T): T {
  const fix = (s: string) => s.replace(/明天早上|明天一早|明早|明日|明天/g, "今天");
  return { ...card, title: fix(card.title), task: fix(card.task), hint: fix(card.hint) };
}
