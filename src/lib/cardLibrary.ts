import type { TaskCard } from "./ai";
import { seededRandom } from "./landscape";
import type { Sky } from "./weather";

// Built-in task cards, used when there's no AI key (or the AI call fails).
// Each task should be small, concrete, free, and doable in about five minutes.

type Season = "spring" | "summer" | "autumn" | "winter";

type LibraryCard = TaskCard & {
  /** Needs going outside: skipped on rainy, snowy or stormy days. */
  outdoor?: true;
  /** Only on dry days (needs sun or open sky). */
  dry?: true;
  /** Only on wet days (rain, snow, storms). */
  wet?: true;
  /** Only in this season (months as in Taiwan / the northern hemisphere). */
  season?: Season;
  /** Only on these weekdays (0 = Sunday). */
  weekdays?: number[];
};

export const CARDS: LibraryCard[] = [
  // --- the five senses ---
  { title: "綠色尋寶", task: "今天走路時，刻意觀察 3 個綠色的東西。", hint: "放慢腳步，讓眼睛重新認識熟悉的路。", outdoor: true },
  { title: "聲音收集", task: "通勤或走路時，找出 3 種平常沒注意到的聲音。", hint: "耳朵打開，世界會變大一點。" },
  { title: "抬頭看天空", task: "找個空檔抬頭看天空 30 秒，記住雲的形狀。", hint: "天空每天都不一樣，就像今天的你。" },
  { title: "慢慢喝一口", task: "喝今天第一杯飲料時，專心感受溫度與味道 3 口。", hint: "專注的一口，比匆忙的一整杯更滋養。" },
  { title: "光的位置", task: "留意今天陽光落在房間或桌上的哪裡，看它慢慢移動。", hint: "光一直在走，提醒我們時間正溫柔地流動。", dry: true },
  { title: "找一種香味", task: "刻意聞一種喜歡的味道：咖啡、肥皂、洗好的衣服都可以。", hint: "氣味是回到當下最快的路。" },
  { title: "手心的觸感", task: "摸一摸身邊三種不同的質感，例如木頭、布料、葉子。", hint: "觸覺會把飄走的心帶回身體。" },
  { title: "今天的顏色", task: "選一個今天的顏色，留意它一天出現了幾次。", hint: "帶著一個小目標看世界，平凡的路也會變有趣。" },
  { title: "會心一笑", task: "在路上找一個讓你會心一笑的招牌或店名。", hint: "城市裡藏著很多人的用心與幽默。", outdoor: true },
  { title: "一朵雲", task: "找一朵雲，猜猜它像什麼。", hint: "允許自己像小時候一樣，無所事事地想像。", dry: true },
  { title: "好看的影子", task: "今天留意一個好看的影子：樹影、窗影，或是你自己的。", hint: "有光的地方，才有影子。", dry: true },
  { title: "一片葉子", task: "仔細看一片葉子，數數它有幾條葉脈。", hint: "小小的葉子，也有完整的世界。" },
  { title: "第一口飯", task: "吃今天的第一口飯時，閉上眼睛慢慢嚼。", hint: "好好吃一口飯，是很實在的幸福。" },
  { title: "窗外的細節", task: "看窗外一分鐘，找出一個以前沒注意到的細節。", hint: "熟悉的風景裡，也藏著新的驚喜。" },
  { title: "好好洗手", task: "洗手時，感受水的溫度和泡泡的觸感。", hint: "平凡的動作，也能是小小的冥想。" },

  // --- gratitude and people ---
  { title: "一句謝謝", task: "對一位常見卻很少道謝的人說聲「謝謝」。", hint: "小小的感謝，會讓兩個人都亮起來。" },
  { title: "微笑傳遞", task: "今天主動對 2 個人微笑。", hint: "微笑是最不費力的禮物。" },
  { title: "突然想到你", task: "傳一則訊息給好久沒聯絡的朋友，只說「突然想到你」。", hint: "被想起，是很溫暖的事。" },
  { title: "具體的稱讚", task: "具體地稱讚一個人做得好的一件事。", hint: "具體的稱讚，會被記很久。" },
  { title: "好好聽", task: "今天和人聊天時，等對方說完再開口。", hint: "被好好聽見，本身就是一種照顧。" },
  { title: "說聲辛苦了", task: "對店員、警衛或清潔人員說一聲「辛苦了」。", hint: "被看見的感覺，會讓一天不一樣。" },
  { title: "謝謝過去的人", task: "在心裡謝謝一位曾經幫過你的人，想想他當時做了什麼。", hint: "感謝不一定要說出口，記得就很珍貴。" },
  { title: "分享一點", task: "把一點好東西分給別人：零食、一首歌、一篇文章都好。", hint: "分享出去的快樂，會加倍回來。" },
  { title: "讓一步", task: "今天在路上或電梯裡，讓別人先走一次。", hint: "慢一步，心會寬一點。" },
  { title: "說出關心", task: "對家人或同住的人，說一句平常沒說出口的關心。", hint: "最近的人，最值得溫柔對待。" },
  { title: "回一則訊息", task: "回覆一則一直擱著的訊息，帶著溫暖的語氣。", hint: "把小事完成，心會輕一點。" },
  { title: "小小的善意", task: "做一件不求回報的小善事，例如順手撿起一個垃圾。", hint: "世界會因為一點點善意變得更好。" },
  { title: "好好說晚安", task: "今晚睡前，好好對家人、朋友或自己說一聲晚安。", hint: "溫柔地結束一天，也是一種幸福。" },

  // --- body ---
  { title: "伸展一下", task: "起身伸展肩膀和脖子，慢慢轉 5 圈。", hint: "身體一直在幫你撐著，記得照顧它。" },
  { title: "慢慢走一段", task: "選一小段路，用比平常慢一半的速度走。", hint: "慢下來，才看得見沿途的風景。", outdoor: true },
  { title: "一杯溫水", task: "專心喝完一整杯溫水，感受它流進身體。", hint: "照顧自己，可以從一杯水開始。" },
  { title: "放鬆眉心", task: "今天每次拿起手機前，先放鬆眉心和肩膀。", hint: "不自覺緊繃的地方，常常藏著疲累。" },
  { title: "踩穩地面", task: "回家後赤腳站一分鐘，感受地板的溫度。", hint: "好好站在地上，心也會穩下來。" },
  { title: "午餐前呼吸", task: "午餐前，閉上眼睛做三次慢慢的深呼吸。", hint: "呼吸是隨身帶著的避風港。" },
  { title: "早一點休息", task: "今晚比平常早 15 分鐘放下手機。", hint: "好好睡覺，是給明天的自己最好的禮物。" },
  { title: "曬五分鐘", task: "找個空檔曬 5 分鐘太陽，讓臉和手背感受溫暖。", hint: "陽光會悄悄把心情調亮一點。", outdoor: true, dry: true },
  { title: "挺直一下", task: "今天想到時就挺直背，讓肩膀輕輕往後放。", hint: "身體打開了，心也會跟著打開。" },

  // --- caring for yourself ---
  { title: "稱讚自己", task: "完成一件小事後，在心裡對自己說「做得好」。", hint: "你也值得被自己溫柔對待。" },
  { title: "三個優點", task: "寫下自己的三個優點，再小都可以。", hint: "你身上有很多值得被看見的好。" },
  { title: "放下一件事", task: "選一件今天可以不做的小事，允許自己放下它。", hint: "不必每件事都做完，你已經很努力了。" },
  { title: "一首歌的時間", task: "專心聽完一首喜歡的歌，什麼都不做。", hint: "讓音樂陪你待一下就好。" },
  { title: "小小的期待", task: "寫下一件最近讓你期待的小事。", hint: "心裡有期待，日子就有光。" },
  { title: "刻意慢一點", task: "今天選一件事，刻意做得慢一點。", hint: "慢不是落後，是好好生活的方式。" },
  { title: "像對好朋友", task: "對自己說一句你會對好朋友說的鼓勵。", hint: "你也值得同樣的溫柔。" },
  { title: "收一個角落", task: "整理桌上或包包裡的一個小角落。", hint: "整理空間，心也跟著清爽起來。" },
  { title: "中午前的好事", task: "中午前，找出今天已經發生的一件小好事。", hint: "好事一直都在，只是需要被注意到。" },
  { title: "一句心情", task: "用一句話記下現在的心情，不必修飾。", hint: "寫下來，心就有地方放。" },
  { title: "一張舊照片", task: "翻一張舊照片，想想當時快樂的原因。", hint: "美好的回憶，是隨時可以回去的地方。" },
  { title: "留白五分鐘", task: "給自己 5 分鐘什麼都不做，只是坐著。", hint: "留白的時間，讓心可以呼吸。" },
  { title: "給明天的紙條", task: "寫一張小紙條給明天的自己，放在看得到的地方。", hint: "明天的你，會很高興收到。" },
  { title: "好好笑一次", task: "看一段讓你會笑的影片或圖片，好好笑一次。", hint: "笑是最輕鬆的放鬆。" },
  { title: "一頁就好", task: "讀一頁喜歡的書或文章。", hint: "一頁就好，讓心有個安靜的地方。" },

  // --- small creative things ---
  { title: "拍下美的", task: "用手機拍下一個今天覺得美的畫面。", hint: "拍照會讓你更用心地看。" },
  { title: "隨手畫畫", task: "隨手畫一個今天看到的東西，畫得不像也沒關係。", hint: "重點不是畫得好，而是看得仔細。" },
  { title: "好奇一下", task: "查一個你一直好奇的詞或典故。", hint: "好奇心，是讓日子保持新鮮的秘訣。" },
  { title: "換一條路", task: "今天換一條沒走過的路，去一個常去的地方。", hint: "新的路，會帶來新的眼睛。", outdoor: true },
  { title: "輕輕哼歌", task: "洗澡或做家事時，輕輕哼一首歌。", hint: "讓聲音把心情帶起來。" },
  { title: "專心吃一餐", task: "今天有一餐不看手機，只專心吃飯。", hint: "好好吃飯，就是好好照顧自己。" },

  // --- nature ---
  { title: "找一棵樹", task: "在路上找一棵你喜歡的樹，記住它的樣子。", hint: "樹每天都在，安安靜靜地陪著我們。", outdoor: true },
  { title: "看看植物", task: "幫身邊的植物澆水，或仔細看看它長出的新葉。", hint: "照顧另一個生命，心會變得柔軟。" },
  { title: "聽一分鐘風", task: "站在窗邊或戶外，聽一分鐘風的聲音。", hint: "風來了又走，煩惱也可以。", dry: true },
  { title: "路邊小花", task: "找一朵路邊的小花，看看它的顏色。", hint: "不起眼的地方，也有認真盛開的生命。", outdoor: true },
  { title: "鳥的聲音", task: "留意一次鳥叫聲，試著找出牠在哪裡。", hint: "城市裡也有屬於自然的音樂。", outdoor: true },
  { title: "今晚的月亮", task: "今晚找找月亮在哪裡，看看它今天的形狀。", hint: "抬頭看月亮的人，心裡都有一點浪漫。", dry: true },
  { title: "傍晚的天色", task: "傍晚時停下來，看一眼天空的顏色。", hint: "一天的結尾，也可以很美。", dry: true },

  // --- rainy days ---
  { title: "聽雨", task: "找個安靜的時刻，專心聽一分鐘雨聲。", hint: "雨聲是大自然最溫柔的白噪音。", wet: true },
  { title: "雨的味道", task: "走到窗邊或門口，聞聞下雨時空氣的味道。", hint: "雨天，也有它獨特的美好。", wet: true },
  { title: "窗上的雨滴", task: "看著窗上的一滴雨，陪它慢慢滑下來。", hint: "慢慢看，時間也會慢下來。", wet: true },
  { title: "捧一杯熱飲", task: "泡一杯熱飲，雙手捧著，感受它的溫暖。", hint: "雨天最適合把自己照顧得暖暖的。", wet: true },
  { title: "好看的傘", task: "留意今天路上一把好看的傘。", hint: "雨天的街道，像一幅會動的畫。", wet: true },

  // --- seasons ---
  { title: "新芽", task: "找找路邊或盆栽裡新長出來的嫩芽。", hint: "新的開始，往往從很小的地方發生。", season: "spring" },
  { title: "春天的花", task: "留意今天看到的一種花，查查它的名字。", hint: "知道名字之後，它就成了你的朋友。", season: "spring" },
  { title: "春天的味道", task: "深呼吸一次，聞聞空氣裡春天的味道。", hint: "季節在換，你也可以慢慢換上新的心情。", season: "spring" },
  { title: "一陣涼風", task: "找個陰涼處，感受一陣涼風吹過。", hint: "炎熱裡的一點涼，特別珍貴。", season: "summer" },
  { title: "冰涼的一口", task: "吃一口冰涼的水果或飲料，慢慢感受那份清涼。", hint: "夏天的小幸福，就藏在這一口裡。", season: "summer" },
  { title: "蟬聲", task: "留意今天聽到的蟬聲，數數牠叫了多久。", hint: "夏天的聲音，提醒你季節正在發生。", season: "summer", outdoor: true },
  { title: "秋天的光", task: "傍晚時看看斜斜的陽光，它比夏天溫柔。", hint: "秋天的光，適合慢慢欣賞。", season: "autumn", dry: true },
  { title: "一片落葉", task: "找一片顏色好看的落葉，帶回家夾在書裡。", hint: "把季節收藏起來，就能隨時翻開。", season: "autumn", outdoor: true },
  { title: "換季", task: "整理一件喜歡的長袖衣服，準備迎接涼意。", hint: "準備好迎接改變，也是一種期待。", season: "autumn" },
  { title: "暖暖的手", task: "冷的時候，把雙手搓熱放在臉頰上。", hint: "自己給自己的溫暖，一樣算數。", season: "winter" },
  { title: "一碗熱湯", task: "喝一碗熱湯，慢慢感受它暖到肚子裡。", hint: "冬天的幸福，常常是熱熱的。", season: "winter" },
  { title: "冬日陽光", task: "找一個有陽光的地方，站著曬一下。", hint: "冬天的太陽，是最好的禮物。", season: "winter", outdoor: true, dry: true },

  // --- particular days ---
  { title: "溫柔開工", task: "開始工作前，先寫下這週最期待的一件事。", hint: "一週的開始不必用力，有個期待就好。", weekdays: [1] },
  { title: "慢慢的週一", task: "允許自己週一慢一點，把最難的事留到下午。", hint: "對自己溫柔，一週才走得長。", weekdays: [1] },
  { title: "週間小獎勵", task: "給自己一個小獎勵，一顆糖或一首歌都好。", hint: "走到一週的中間，你已經很棒了。", weekdays: [3] },
  { title: "謝謝這一週", task: "對一位這週幫過你的同事或朋友說聲謝謝。", hint: "帶著感謝結束一週，週末會更輕盈。", weekdays: [5] },
  { title: "這週的驕傲", task: "寫下這週一件讓你有點驕傲的事。", hint: "看見自己的努力，才能好好休息。", weekdays: [5] },
  { title: "多睡一會", task: "今天早上不設鬧鐘，或多賴床 5 分鐘。", hint: "好好休息，也是生活的一部分。", weekdays: [0, 6] },
  { title: "沒有目的的散步", task: "找 15 分鐘到附近散步，不設目的地。", hint: "沒有目的的散步，常常有意外的收穫。", weekdays: [0, 6], outdoor: true },
  { title: "做一道菜", task: "為自己或家人做一道簡單的料理。", hint: "親手做的食物，有特別的味道。", weekdays: [0, 6] },
  { title: "專心陪伴", task: "放下手機一小時，好好陪伴一個重要的人。", hint: "最好的禮物，是專心的陪伴。", weekdays: [0, 6] },
  { title: "週日整理", task: "整理一個抽屜，為新的一週騰出空間。", hint: "清出空間，好事才進得來。", weekdays: [0] },
];

const WET: Sky[] = ["下雨", "下雪", "雷雨"];

function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/** Days since 1970-01-01 for a "YYYY-MM-DD" date: consecutive days give consecutive numbers. */
function dayNumber(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

// A fixed shuffle of the library, so consecutive days mix categories instead of
// walking through all the "senses" cards, then all the "people" cards, and so on.
const ORDER = (() => {
  const rand = seededRandom("happiness-cards");
  const cards = [...CARDS];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
})();

/** Season matches, and the weather allows it. Unknown weather (`wet` undefined) allows everything but rain cards. */
const fits = (card: LibraryCard, season: Season, wet: boolean | undefined) =>
  (!card.season || card.season === season) &&
  !(wet === true && (card.outdoor || card.dry)) &&
  !(wet !== true && card.wet);

/**
 * Today's built-in card. The same date always gives the same card, and consecutive
 * days walk through the library in order, so cards don't repeat for months.
 *
 * - Rainy days skip outdoor cards and, every other day, show a rainy-day card.
 * - Every other week, days with their own cards (Monday, Friday, weekends…) show one.
 * - Seasonal cards only appear in their season.
 */
export function pickCard({ date, sky }: { date: string; sky?: Sky }): TaskCard {
  const n = dayNumber(date);
  let card = pickForDay(n, sky);
  // When the pool changes (a new season, rain), the rotation can land on yesterday's card.
  // Then take one from the far side of the rotation that is neither yesterday's nor tomorrow's.
  const yesterday = pickForDay(n - 1, sky).title;
  if (card.title === yesterday) {
    const tomorrow = pickForDay(n + 1, sky).title;
    for (let skip = 20; card.title === yesterday || card.title === tomorrow; skip++) card = pickForDay(n, sky, skip);
  }
  const { title, task, hint } = card;
  return { title, task, hint };
}

function pickForDay(n: number, sky: Sky | undefined, skip = 0): LibraryCard {
  const date = new Date(n * 86_400_000);
  const weekday = date.getUTCDay();
  const season = seasonOf(date.getUTCMonth() + 1);
  const wet = sky ? WET.includes(sky) : undefined;
  const pool = ORDER.filter((c) => fits(c, season, wet));
  const general = pool.filter((c) => !c.weekdays && !c.wet);
  if (skip) return general[(n + skip) % general.length];

  if (wet) {
    const rainy = pool.filter((c) => c.wet);
    if (rainy.length && n % 2 === 0) return rainy[(n / 2) % rainy.length];
  }

  // Every other week; weekend cards go to Saturday one week and Sunday the next, never both.
  const week = Math.floor((n + 3) / 7); // weeks start on Monday (1970-01-01 was a Thursday)
  const forToday = pool.filter((c) => c.weekdays?.includes(weekday));
  if (forToday.length && (week + (weekday === 0 ? 1 : 0)) % 2 === 0) {
    return forToday[Math.floor(week / 2) % forToday.length];
  }

  return general[n % general.length];
}
