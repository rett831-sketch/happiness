// Dates written in Chinese numerals, e.g. 二〇二六年十月七日 · 星期三.

const DIGITS = "〇一二三四五六七八九";

/** 1–31 in Chinese numerals: 7 → 七, 12 → 十二, 24 → 二十四. */
function zhNumber(n: number) {
  if (n <= 10) return n === 10 ? "十" : DIGITS[n];
  const tens = Math.floor(n / 10);
  return `${tens > 1 ? DIGITS[tens] : ""}十${n % 10 ? DIGITS[n % 10] : ""}`;
}

/** 十月七日 — unambiguous, unlike 07 · 10 which reads like 7/10. */
export function monthDay(d: Date) {
  return `${zhNumber(d.getMonth() + 1)}月${zhNumber(d.getDate())}日`;
}

/** 十月七日 · 星期三 */
export function monthDayWeekday(d: Date) {
  return `${monthDay(d)} · 星期${"日一二三四五六"[d.getDay()]}`;
}

/** 二〇二六年十月七日 · 星期三 — years are read digit by digit. */
export function fullDate(d: Date) {
  const year = [...String(d.getFullYear())].map((c) => DIGITS[Number(c)]).join("");
  return `${year}年${monthDayWeekday(d)}`;
}
