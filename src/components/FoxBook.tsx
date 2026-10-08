"use client";

import Link from "next/link";
import { useState } from "react";
import Ambience from "./Ambience";
import CardArt, { SCENE_NAMES, sceneName } from "./CardArt";
import Fox, { POSE_NAMES, STAGE_NAMES, type FoxPose, type FoxStage } from "./Fox";
import { FoxGrewUp } from "./FoxModals";
import Moon from "./Moon";
import { EGGS, EGG_IDS, loadFoundEggs, type EggId } from "@/lib/eggs";
import type { JournalEntry } from "./NightJournal";
import {
  STAGE_AT,
  STAGE_OUTFIT,
  backupForDemo,
  daysTogether,
  daysUntil,
  hasDemoBackup,
  loadFox,
  loadSeenPoses,
  restoreFromDemo,
  saveFox,
  stageFor,
  type FoxState,
} from "@/lib/fox";
import { loadAll, save } from "@/lib/storage";
import { useIsClient } from "@/lib/useIsClient";

const STAGES: FoxStage[] = [1, 2, 3, 4, 5];
const POSES = Object.keys(POSE_NAMES) as FoxPose[];

/** When each pose shows up, as a hint for poses not collected yet. */
const POSE_HINTS: Record<FoxPose, string> = {
  sit: "平常陪著你",
  card: "早上打開的時候",
  tilt: "翻開卡片之後",
  jump: "完成今天的任務",
  tea: "一起呼吸的時候",
  flower: "呼吸完成之後",
  lie: "晚上等你的時候",
  explore: "寫完三件好事之後",
  sleep: "深夜的時候",
  wave: "摸摸牠",
  cheeks: "摸摸牠",
  heart: "摸摸牠",
};

/** A locked item: the fox's silhouette. */
const silhouette = { filter: "brightness(0)", opacity: 0.13 } as const;

export default function FoxBook() {
  const isClient = useIsClient();
  return (
    <main className="relative min-h-screen px-6 pb-20 pt-10 text-ink">
      <Ambience night={false} />
      <div className="mx-auto max-w-sm">
        <nav className="flex animate-fade justify-between">
          <p className="text-sm tracking-[0.2em] text-ink-soft">小福圖鑑</p>
          <Link
            href="/"
            className="border-b border-ink/25 pb-0.5 font-sans text-xs tracking-[0.25em] text-ink-soft transition hover:border-moss hover:text-moss"
          >
            回到今天
          </Link>
        </nav>
        {isClient && <Book />}
      </div>
    </main>
  );
}

function Book() {
  const [fox, setFox] = useState<FoxState | null>(loadFox);
  const [poses, setPoses] = useState<FoxPose[]>(loadSeenPoses);
  const [eggs, setEggs] = useState<EggId[]>(loadFoundEggs);
  const [demo] = useState(() => new URLSearchParams(window.location.search).has("demo"));
  const [backedUp, setBackedUp] = useState(hasDemoBackup);
  const [replay, setReplay] = useState<FoxStage | null>(null);
  const [entries] = useState(() => loadAll<JournalEntry>("night"));

  if (!fox) {
    return (
      <div className="mt-14 animate-rise rounded-[1.5rem] bg-card p-7 text-center">
        <p className="text-lg font-light">你還沒有小狐狸。</p>
        <Link href="/" className="mt-4 inline-block border-b border-ink/40 pb-0.5 font-sans text-sm tracking-[0.3em] hover:text-moss">
          去認識牠
        </Link>
      </div>
    );
  }

  const stage = stageFor(fox.points);
  const next = stage < 5 ? ((stage + 1) as FoxStage) : null;

  // Where the fox has explored: one place per evening's "tomorrow card".
  const places = new Map<string, { count: number; seed: string }>();
  for (const [, entry] of entries) {
    const name = sceneName(entry.tomorrowCard.title);
    const p = places.get(name);
    places.set(name, { count: (p?.count ?? 0) + 1, seed: p?.seed ?? entry.tomorrowCard.title });
  }

  // --- demo mode ---
  function setStage(s: FoxStage) {
    if (!fox) return;
    backupForDemo();
    setBackedUp(true);
    const updated = { ...fox, points: STAGE_AT[s], seenStage: s };
    saveFox(updated);
    setFox(updated);
  }
  function unlockAllPoses() {
    backupForDemo();
    setBackedUp(true);
    save("foxPoses", POSES);
    setPoses(POSES);
  }
  function unlockAllEggs() {
    backupForDemo();
    setBackedUp(true);
    save("eggs", EGG_IDS);
    setEggs(EGG_IDS);
  }
  function restore() {
    restoreFromDemo();
    setBackedUp(false);
    setFox(loadFox());
    setPoses(loadSeenPoses());
    setEggs(loadFoundEggs());
  }

  return (
    <>
      {demo && (
        <section className="mt-6 rounded-[1.25rem] border border-dashed border-seal/50 bg-card p-4">
          <p className="font-sans text-xs tracking-[0.3em] text-seal">展示模式</p>
          <p className="mt-1 font-sans text-xs font-light text-ink-soft">只會改這台裝置上的小福。展示完按「還原」就會回到原本的樣子。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={`rounded-full px-3 py-1.5 font-sans text-xs ${s === stage ? "bg-moss text-paper" : "bg-paper text-ink-soft hover:text-ink"}`}
              >
                {STAGE_NAMES[s]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-sans text-xs tracking-[0.15em]">
            <button type="button" onClick={() => setReplay(stage === 1 ? 2 : stage)} className="border-b border-ink/30 pb-0.5 hover:text-moss">
              播放長大動畫
            </button>
            <button type="button" onClick={unlockAllPoses} className="border-b border-ink/30 pb-0.5 hover:text-moss">
              解鎖全部動作
            </button>
            <button type="button" onClick={unlockAllEggs} className="border-b border-ink/30 pb-0.5 hover:text-moss">
              解鎖全部彩蛋
            </button>
            {backedUp && (
              <button type="button" onClick={restore} className="border-b border-seal/60 pb-0.5 text-seal">
                還原原本的小福
              </button>
            )}
          </div>
        </section>
      )}

      {/* the fox now */}
      <header className="mt-10 flex animate-rise items-center gap-4">
        <Fox stage={stage} pose="sit" size={130} animated />
        <div>
          <h1 className="text-2xl tracking-[0.15em]">{fox.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">{STAGE_NAMES[stage]}</p>
          <p className="mt-3 font-sans text-xs font-light leading-relaxed text-ink-soft">
            一起練習了 {daysTogether(fox)} 天
            <br />
            陽光 {fox.sun} · 露水 {fox.dew} · 微風 {fox.breeze}
            {next && (
              <>
                <br />
                最快再 {daysUntil(fox.points, next)} 天長成{STAGE_NAMES[next]}
              </>
            )}
          </p>
        </div>
      </header>

      {/* growth stages */}
      <Section title="成長" note={`${stage} / 5`}>
        <ul className="grid grid-cols-3 gap-3">
          {STAGES.map((s) => {
            const reached = s <= stage;
            return (
              <li key={s} className="rounded-2xl bg-card p-2 text-center">
                <span className="block" style={reached ? undefined : silhouette}>
                  <Fox stage={s} pose="sit" size={88} />
                </span>
                <p className="mt-1 text-sm">{reached ? STAGE_NAMES[s] : "？？？"}</p>
                <p className="mt-0.5 font-sans text-[10px] font-light leading-snug text-ink-soft">
                  {reached ? STAGE_OUTFIT[s] || "剛來到你身邊" : `最快再 ${daysUntil(fox.points, s)} 天`}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* poses */}
      <Section title="動作" note={`已收集 ${poses.length} / ${POSES.length}`}>
        <ul className="grid grid-cols-4 gap-2">
          {POSES.map((p) => {
            const seen = poses.includes(p);
            return (
              <li key={p} className="rounded-xl bg-card px-1 pb-2 pt-1 text-center">
                <span className="block" style={seen ? undefined : silhouette}>
                  <Fox stage={stage} pose={p} size={70} />
                </span>
                <p className="font-sans text-[11px]">{seen ? POSE_NAMES[p] : "？？？"}</p>
                {!seen && <p className="mt-0.5 font-sans text-[9px] font-light leading-tight text-ink-faint">{POSE_HINTS[p]}</p>}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* places */}
      <Section title="去過的地方" note={`${places.size} / ${SCENE_NAMES.length}`}>
        <ul className="grid grid-cols-2 gap-3">
          {SCENE_NAMES.map((name) => {
            const place = places.get(name);
            return (
              <li key={name} className="overflow-hidden rounded-2xl bg-card">
                <div className="h-16 overflow-hidden" style={place ? undefined : silhouette}>
                  <CardArt seed={place?.seed ?? name} className="h-full w-full" />
                </div>
                <div className="flex items-baseline justify-between px-3 py-2">
                  <span className="text-sm">{place ? name : "？？？"}</span>
                  {place && <span className="font-sans text-[11px] text-ink-faint">{place.count} 次</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 font-sans text-xs font-light text-ink-soft">晚上寫完三件好事，{fox.name}就會出門探險，隔天早上帶回那裡的明信片。</p>
      </Section>

      {/* easter eggs */}
      <Section title="彩蛋" note={`已發現 ${eggs.length} / ${EGG_IDS.length}`}>
        <ul className="space-y-2">
          {EGG_IDS.map((id) => {
            const found = eggs.includes(id);
            const egg = EGGS[id];
            return (
              <li key={id} className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2">
                <span className="flex size-14 shrink-0 items-center justify-center" style={found ? undefined : silhouette}>
                  {id === "moon" ? (
                    <span className="flex size-12 items-center justify-center rounded-full bg-night">
                      <Moon fox className="size-9" />
                    </span>
                  ) : (
                    <Fox stage={stage} pose={egg.pose} mood={egg.mood} size={56} />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm">{found ? egg.name : "？？？"}</p>
                  <p className="mt-0.5 font-sans text-[11px] font-light leading-snug text-ink-soft">
                    {found ? egg.how : `提示：${egg.hint}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {replay && <FoxGrewUp name={fox.name} stage={replay} onClose={() => setReplay(null)} />}
    </>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 animate-rise">
      <div className="mb-4 flex items-baseline justify-between border-b border-ink/10 pb-2">
        <h2 className="text-lg tracking-[0.3em]">{title}</h2>
        <span className="font-sans text-xs text-ink-faint">{note}</span>
      </div>
      {children}
    </section>
  );
}
