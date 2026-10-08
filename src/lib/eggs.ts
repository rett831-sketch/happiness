import type { FoxMood, FoxPose } from "@/components/Fox";
import { load, save } from "./storage";

/** Hidden surprises. Found ones are listed in the handbook (/fox); the rest show a vague hint. */
export type EggId = "shy" | "owl" | "osmanthus" | "moon" | "note";

export const EGGS: Record<
  EggId,
  {
    name: string;
    /** Shown while still hidden. */
    hint: string;
    /** Shown once found: how it happened. */
    how: string;
    /** What 小福 does and says when it happens. */
    pose: FoxPose;
    mood?: FoxMood;
    line: string;
  }
> = {
  shy: {
    name: "害羞的小狐狸",
    hint: "一直、一直摸牠",
    how: "連續摸牠十下，牠就害羞得摀住臉。",
    pose: "cheeks",
    line: "別、別一直摸啦⋯⋯好害羞。",
  },
  owl: {
    name: "夜貓子",
    hint: "很晚很晚了，還醒著",
    how: "凌晨兩點到四點打開，牠會揉著眼睛陪你。",
    pose: "sit",
    mood: "sleep",
    line: "（揉揉眼睛）你怎麼還沒睡？我陪你一下下就好⋯⋯",
  },
  osmanthus: {
    name: "桂花雨",
    hint: "碰碰上面那枝桂花",
    how: "點一下桂花枝，花瓣就會飄下來。",
    pose: "flower",
    line: "桂花掉下來了！我接到一朵，好香～",
  },
  moon: {
    name: "月亮上的狐狸",
    hint: "夜裡，按住月亮不放",
    how: "長按夜晚的月亮，月亮上住的不是玉兔，是狐狸。",
    pose: "tilt",
    line: "被你發現了！月亮上住的是我的遠房親戚。",
  },
  note: {
    name: "寫到我了",
    hint: "在三件好事裡提到牠",
    how: "日記裡寫到牠的名字，牠會開心得轉圈圈。",
    pose: "heart",
    mood: "excited",
    line: "你寫到我了！我開心到轉圈圈～",
  },
};

export const EGG_IDS = Object.keys(EGGS) as EggId[];

export function loadFoundEggs(): EggId[] {
  return load<EggId[]>("eggs") ?? [];
}
/** Records the egg as found; true if this is the first time. */
export function findEgg(id: EggId) {
  const found = loadFoundEggs();
  if (found.includes(id)) return foundOnOpen.has(id);
  save("eggs", [...found, id]);
  return true;
}

// Eggs found while the page was opening (the owl). React may mount the page twice in development,
// so the second mount must still see the egg as new.
const foundOnOpen = new Set<EggId>();
/** Like findEgg, for eggs found as the page opens. */
export function findEggOnOpen(id: EggId) {
  const isNew = findEgg(id);
  if (isNew) foundOnOpen.add(id);
  return isNew;
}

/** 凌晨兩點到四點. */
export function isOwlHour(date = new Date()) {
  const h = date.getHours();
  return h >= 2 && h < 4;
}

/** Whether the journal mentions the fox, by its name or as 小狐狸 (names can be changed). */
export function mentionsFox(texts: string[], name: string) {
  return texts.some((t) => t.includes(name) || t.includes("小狐狸"));
}
