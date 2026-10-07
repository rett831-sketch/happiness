import type { Echo, TaskCard } from "./ai";

// Used when the AI call fails (e.g. no ANTHROPIC_API_KEY), so the flow still works.
const CARDS: TaskCard[] = [
  { title: "綠色尋寶", task: "今天走路時，刻意觀察 3 個綠色的東西。", hint: "放慢腳步，讓眼睛重新認識熟悉的路。" },
  { title: "一句謝謝", task: "對一位常見卻很少道謝的人說聲「謝謝」。", hint: "小小的感謝，會讓兩個人都亮起來。" },
  { title: "慢慢喝一口", task: "喝今天第一杯飲料時，專心感受溫度與味道 3 口。", hint: "專注的一口，比匆忙的一整杯更滋養。" },
  { title: "抬頭看天空", task: "找個空檔抬頭看天空 30 秒，記住雲的形狀。", hint: "天空每天都不一樣，就像今天的你。" },
  { title: "微笑傳遞", task: "今天主動對 2 個人微笑。", hint: "微笑是最不費力的禮物。" },
  { title: "聲音收集", task: "通勤時找出 3 種平常沒注意到的聲音。", hint: "耳朵打開，世界會變大一點。" },
  { title: "稱讚自己", task: "完成一件小事後，在心裡對自己說「做得好」。", hint: "你也值得被自己溫柔對待。" },
];

export function fallbackCard(weekdayIndex: number): TaskCard {
  return CARDS[weekdayIndex % CARDS.length];
}

export function fallbackEcho(goodThings: string[]): Echo {
  const first = goodThings.find(Boolean);
  return {
    reply: first
      ? `謝謝你記下「${first}」。願意在一天結束時回頭看見美好，本身就是一種很珍貴的能力。今晚好好休息，你今天已經做得很好了。`
      : "謝謝你今晚回來這裡。就算今天平淡或辛苦，願意停下來回顧，就是在好好照顧自己。今晚好好休息。",
    tomorrowCard: {
      title: "延續今天的光",
      task: first ? `明天試著再創造一次像「${first}」這樣的時刻。` : "明天留意一件讓你嘴角上揚的小事。",
      hint: "幸福會被注意到的地方，慢慢長大。",
    },
  };
}
