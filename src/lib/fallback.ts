import type { Echo, TaskCard, Weekly, WeeklyEntry } from "./ai";
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

// Keyword groups for spotting the week's themes without AI.
const THEMES: [string, RegExp][] = [
  ["家人的陪伴", /家人|媽|爸|爺|奶|阿嬤|阿公|兄|弟|姊|姐|妹|孩子|老公|老婆|家裡/],
  ["朋友與同事", /朋友|同事|同學|夥伴|主管|老闆|聊天|揪/],
  ["好吃的食物", /吃|喝|早餐|午餐|晚餐|咖啡|茶|甜|點心|便當|蛋|飯|麵/],
  ["大自然", /天空|雲|太陽|陽光|花|樹|風|雨|月|星|海|山|公園|鳥/],
  ["照顧自己", /休息|睡|運動|散步|跑步|伸展|放鬆|洗澡|按摩|瑜珈/],
  ["小小的成就", /完成|做到|學會|進步|稱讚|順利|成功|交出|搞定/],
  ["陌生人的善意", /阿姨|叔叔|店員|陌生|路人|司機|鄰居|幫忙|讓座/],
];

/** A built-in weekly letter in the fox's voice, quoting what the visitor actually wrote. */
export function fallbackWeekly(entries: WeeklyEntry[]): Weekly {
  const things = entries.flatMap((e) => e.goodThings.filter(Boolean));
  const counted = THEMES.map(([theme, re]) => [theme, things.filter((t) => re.test(t)).length] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const themes = counted.slice(0, 3).map(([t]) => t);
  const quote = things.slice(0, 2).map((t) => `「${t}」`).join("，還有");
  const top = counted[0];

  const letter = [
    `這週你回來了 ${entries.length} 天，一共告訴我 ${things.length} 件好事。`,
    quote ? `我最記得的是${quote}，聽的時候我的尾巴都忍不住搖了起來。` : "",
    top && top[1] >= 2 ? `你這週提到「${top[0]}」好幾次，看得出來它們讓你很安心。` : "",
    "願意在每天結束時停下來，看見那些小小的美好，本身就是一件很了不起的事。",
    "下週我們也一起慢慢來吧。我會在這裡等你。",
  ]
    .filter(Boolean)
    .join("");

  return { letter, themes: themes.length ? themes : ["小小的美好"] };
}
