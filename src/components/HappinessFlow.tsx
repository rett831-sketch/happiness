"use client";

import { useEffect, useState } from "react";
import type { TaskCard as Card, KeyProblem } from "@/lib/ai";
import { aiHeaders, getApiKey } from "@/lib/apiKey";
import Link from "next/link";
import { useIsClient } from "@/lib/useIsClient";
import { DAY_START_HOUR, calendarKey, dateKey, load, logicalDate, save } from "@/lib/storage";
import TaskCard from "./TaskCard";
import BreathTimer from "./BreathTimer";
import NightJournal from "./NightJournal";
import Ambience from "./Ambience";
import PosterHeader from "./PosterHeader";
import KeySettings from "./KeySettings";
import AiNotice from "./AiNotice";
import FoxCompanion, { type Situation, type Special } from "./FoxCompanion";
import { findEgg, findEggOnOpen, isOwlHour, mentionsFox, type EggId } from "@/lib/eggs";
import { FoxGrewUp, FoxWelcome } from "./FoxModals";
import { sceneName } from "./CardArt";
import type { FoxStage } from "./Fox";
import {
  caredToday,
  daysBetween,
  daysTogether,
  giveCare,
  loadFox,
  newFox,
  saveFox,
  stageFor,
  type CareKind,
  type FoxState,
} from "@/lib/fox";
import { monthDay, monthDayWeekday } from "@/lib/zhDate";
import { asReadNextMorning } from "@/lib/cardText";

type Mode = "morning" | "night";
type StoredCard = { card: Card; fromLastNight: boolean };

// Morning from DAY_START_HOUR (05:00) to 16:59, night otherwise.
const modeForNow = (): Mode => {
  const h = new Date().getHours();
  return h >= DAY_START_HOUR && h < 17 ? "morning" : "night";
};

// Last night's reward card becomes this morning's card.
function loadTodayCard(key: string): StoredCard | null {
  const existing = load<StoredCard>(`card:${key}`);
  // cards gifted before the 明早 wording fix still get it
  if (existing) return existing.fromLastNight ? { ...existing, card: asReadNextMorning(existing.card) } : existing;
  const saved = load<Card>(`tomorrow:${key}`);
  if (!saved) return null;
  const gifted = asReadNextMorning(saved);
  const stored = { card: gifted, fromLastNight: true };
  save(`card:${key}`, stored);
  return stored;
}

/** Loads the fox, records today's visit, and notes whether the visitor was away for a while. */
function openFox(): { fox: FoxState | null; welcomeBack: boolean } {
  const fox = loadFox();
  if (!fox) return { fox: null, welcomeBack: false };
  const today = dateKey();
  const away = daysBetween(fox.lastVisit, today);
  const updated = { ...fox, lastVisit: today };
  saveFox(updated);
  return { fox: updated, welcomeBack: away >= 3 };
}

// Time of day and localStorage only exist in the browser, so skip server rendering.
export default function HappinessFlow() {
  const isClient = useIsClient();
  if (!isClient) return <main className="min-h-screen bg-amber-50" />;
  return <Flow />;
}

function Flow() {
  const [mode, setMode] = useState<Mode>(modeForNow);
  // The day each page is for. Between midnight and 05:00 they differ: the night page is still
  // last night (journaling after midnight counts for it), while switching to 晨 starts the new day.
  const cardKey = mode === "night" ? dateKey() : calendarKey();
  const [cardState, setCardState] = useState(() => ({ key: cardKey, card: loadTodayCard(cardKey) }));
  if (cardState.key !== cardKey) setCardState({ key: cardKey, card: loadTodayCard(cardKey) });
  const today = cardState.key === cardKey ? cardState.card : null;
  const setToday = (card: StoredCard | null) => setCardState({ key: cardKey, card });
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Where today's freshly drawn card came from (null for saved or gifted cards).
  const [cardInfo, setCardInfo] = useState<{ source: "ai" | "local"; keyProblem?: KeyProblem } | null>(null);
  const [keyOpen, setKeyOpen] = useState(false);

  // --- the fox companion ---
  const [opened] = useState(openFox);
  const [fox, setFox] = useState<FoxState | null>(opened.fox);
  const [gained, setGained] = useState<CareKind | null>(null); // care just given, for the "+10" note
  const [grewTo, setGrewTo] = useState<FoxStage | null>(null);
  // What the visitor did most recently this session; drives what the fox says.
  const [lastEvent, setLastEvent] = useState<"flip" | "breathStart" | "breathDone" | "task" | null>(null);
  const [breathing, setBreathing] = useState(false);
  const [nightSending, setNightSending] = useState(false);
  const [journaled, setJournaled] = useState(() => Boolean(load(`night:${dateKey()}`)));

  // --- easter eggs: the one playing now (it lasts until the next thing happens) ---
  const [special, setSpecial] = useState<Special | null>(() =>
    opened.fox && mode === "night" && isOwlHour() ? { id: "owl", isNew: findEggOnOpen("owl"), n: 1 } : null,
  );
  function egg(id: EggId) {
    const isNew = findEgg(id);
    setSpecial((s) => ({ id, isNew, n: (s?.n ?? 0) + 1 }));
  }

  /** Gives today's care (once a day), and celebrates if the fox reaches a new stage. */
  function care(kind: CareKind) {
    if (!fox) return;
    // the journal belongs to the night's day; the task and breathing to the morning's
    const next = giveCare(fox, kind, kind === "journal" ? dateKey() : cardKey);
    if (next === fox) return;
    saveFox(next);
    setFox(next);
    setGained(kind);
    const stage = stageFor(next.points);
    if (stage > next.seenStage) setGrewTo(stage);
  }

  function closeGrewUp() {
    if (fox && grewTo) {
      const next = { ...fox, seenStage: grewTo };
      saveFox(next);
      setFox(next);
    }
    setGrewTo(null);
  }

  // Draw a new card only in the morning, so opening the app at night never triggers it.
  useEffect(() => {
    if (today || mode !== "morning") return;
    let cancelled = false;
    (async () => {
      try {
        // Weather is looked up on the server from the approximate IP location: no permission prompt.
        const res = await fetch("/api/card", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...aiHeaders() },
          body: JSON.stringify({ weekdayIndex: new Date().getDay(), date: cardKey }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { card, source, keyProblem } = (await res.json()) as {
          card: Card;
          source: "ai" | "local";
          keyProblem?: KeyProblem;
        };
        const stored = { card, fromLastNight: false };
        // Keep AI cards, and built-in cards for visitors without a key (so the card doesn't change
        // during the day). With a key, a temporary AI failure shouldn't lock in a built-in card.
        if (source === "ai" || !getApiKey()) save(`card:${cardKey}`, stored);
        if (!cancelled) {
          setCardState({ key: cardKey, card: stored });
          setCardInfo({ source, keyProblem });
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [today, mode, attempt, cardKey]);

  // After adding or changing a key, redraw today's built-in card with AI right away.
  function onKeyChange() {
    if (mode === "morning" && today && !load(`card:${cardKey}`)) {
      setToday(null);
      setCardInfo(null);
      setFailed(false);
    }
  }

  const night = mode === "night";
  const day = night ? logicalDate() : new Date();

  const hour = new Date().getHours();
  const taskDone = fox ? caredToday(fox, "task", cardKey) : false;
  let situation: Situation;
  if (night) {
    const late = hour >= 23 || hour < DAY_START_HOUR;
    situation = nightSending ? "nightSending" : journaled ? (late ? "lateSleep" : "nightAfter") : "nightBefore";
  } else if (breathing) situation = "breathing";
  else if (lastEvent === "breathDone") situation = "breathDone";
  else if (taskDone) situation = "morningDone";
  else if (lastEvent === "flip") situation = "morningFlipped";
  else situation = today?.fromLastNight ? "morningGift" : "morningCard";
  if (opened.welcomeBack && lastEvent === null && !nightSending && !journaled) situation = "welcomeBack";

  // Each day is one lesson: days practised so far, counting today even before any care.
  const lesson = fox ? daysTogether(fox) + (fox.days[cardKey] ? 0 : 1) : 1;
  const rule = `h-px flex-1 ${night ? "bg-moon/20" : "bg-ink/15"}`;

  const companion = fox && (
    <FoxCompanion
      fox={fox}
      situation={situation}
      place={today?.fromLastNight ? sceneName(today.card.title) : undefined}
      night={night}
      gained={gained}
      special={special}
      onEgg={egg}
    />
  );
  const couplet = coupletOfTheDay(night);
  const dateLabel = monthDay(day);
  const link = `font-sans text-xs tracking-[0.25em] border-b pb-0.5 transition ${
    night ? "border-moon/30 text-moon/80 hover:text-moon" : "border-ink/25 text-ink-soft hover:text-moss hover:border-moss"
  }`;

  return (
    <main className={`relative min-h-screen px-6 pb-20 pt-10 ${night ? "text-moon" : "text-ink"}`}>
      <Ambience night={night} />

      <nav className="mx-auto flex max-w-sm animate-fade items-center justify-between">
        <div>
          <p className="text-base tracking-[0.3em]">幸福練習課</p>
          <p className={`mt-0.5 text-xs tracking-[0.2em] ${night ? "text-moon/60" : "text-ink-soft"}`}>{monthDayWeekday(day)}</p>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setMode(night ? "morning" : "night");
              setSpecial(null);
            }}
            className={link}
            title="手動切換早晨 / 夜間"
          >
            {night ? "晨" : "夜"}
          </button>
          <button type="button" onClick={() => setKeyOpen(true)} className={link}>
            金鑰
          </button>
          <Link href="/fox" className={link}>
            圖鑑
          </Link>
          <Link href="/collection" className={link}>
            收藏
          </Link>
        </div>
      </nav>

      <PosterHeader
        glyph={night ? "夜" : "晨"}
        label={night ? "晚安" : "早安"}
        couplet={couplet}
        seal={night ? "安眠" : "清晨"}
        night={night}
        className="mt-8"
        onBranchTap={fox ? () => egg("osmanthus") : undefined}
        onMoonHold={fox ? () => egg("moon") : undefined}
      />

      {/* today's lesson */}
      <div className={`mx-auto mb-12 max-w-sm text-center ${night ? "text-moon/80" : "text-ink-soft"}`}>
        <p className="flex items-center gap-4">
          <span className={rule} />
          <span className={`text-lg tracking-[0.3em] ${night ? "text-moon" : "text-ink"}`}>第 {lesson} 堂</span>
          <span className={rule} />
        </p>
        <p className="mt-1.5 text-sm font-light tracking-[0.15em]">每天兩次，和{fox?.name ?? "小福"}一起練習幸福</p>
      </div>

      {night ? (
        <div className="space-y-12">
          {companion}
          <NightJournal
            todayCard={today?.card ?? null}
            onOpenKeySettings={() => setKeyOpen(true)}
            foxName={fox?.name}
            onSendingChange={(sending) => {
              setNightSending(sending);
              if (sending) setSpecial(null);
            }}
            onSaved={(entry) => {
              setJournaled(true);
              care("journal");
              if (fox && mentionsFox([...entry.goodThings, entry.reflection], fox.name)) egg("note");
            }}
          />
        </div>
      ) : (
        <div className="space-y-14">
          {companion}
          <TaskCard
            key={today?.card.title ?? "pending"}
            card={today?.card ?? null}
            seed={cardKey}
            dateLabel={dateLabel}
            failed={failed}
            badge={today?.fromLastNight ? "昨夜留箋" : undefined}
            onFlip={() => {
              setLastEvent("flip");
              setSpecial(null);
            }}
          />
          {fox && (taskDone || lastEvent === "flip") && (
            <div className="-mt-8 text-center">
              {taskDone ? (
                <p className="font-sans text-sm tracking-[0.3em] text-moss">今天的任務完成了</p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setLastEvent("task");
                    setSpecial(null);
                    care("task");
                  }}
                  className="rounded-full bg-moss px-8 py-2.5 font-sans text-sm tracking-[0.4em] text-paper shadow-md transition hover:brightness-110 active:scale-95"
                >
                  完成了
                </button>
              )}
            </div>
          )}
          {cardInfo?.source === "local" && (
            <div className="-mt-8">
              <AiNotice keyProblem={cardInfo.keyProblem} onOpenSettings={() => setKeyOpen(true)} />
            </div>
          )}
          {failed && (
            <div className="-mt-8 text-center">
              <p className="text-sm font-light text-ink-soft">連線有些不順，卡片還沒來。</p>
              <button
                type="button"
                onClick={() => {
                  setFailed(false);
                  setAttempt((n) => n + 1);
                }}
                className="mt-3 border-b border-ink/40 pb-1 font-sans text-sm tracking-[0.3em] hover:border-moss hover:text-moss"
              >
                再試一次
              </button>
            </div>
          )}
          <BreathTimer
            onStart={() => {
              setBreathing(true);
              setSpecial(null);
              setLastEvent("breathStart");
            }}
            onComplete={() => {
              setBreathing(false);
              setLastEvent("breathDone");
              care("breath");
            }}
          />
        </div>
      )}

      {keyOpen && <KeySettings onClose={() => setKeyOpen(false)} onChange={onKeyChange} />}
      {!fox && (
        <FoxWelcome
          onDone={(name) => {
            const f = newFox(name);
            saveFox(f);
            setFox(f);
          }}
        />
      )}
      {fox && grewTo && <FoxGrewUp name={fox.name} stage={grewTo} onClose={closeGrewUp} />}
    </main>
  );
}

// Four-character couplets, written vertically in the header.
const MORNING_COUPLETS: [string, string][] = [
  ["晨光微涼", "慢慢醒來"],
  ["風過竹林", "心也輕了"],
  ["葉上有露", "日子有光"],
  ["一壺清茶", "半日閒情"],
  ["山色如黛", "步履從容"],
  ["花開不急", "你也不必"],
  ["雲在天上", "心在當下"],
];
const NIGHT_COUPLETS: [string, string][] = [
  ["月照湖心", "萬事皆安"],
  ["螢火點點", "好事件件"],
  ["夜涼如水", "心靜如山"],
  ["燈下記事", "收好今天"],
  ["風停樹靜", "該歇息了"],
  ["星落人間", "一夜好眠"],
  ["日落息心", "靜心安枕"],
];

/** A couplet that changes daily (same couplet all day). */
function coupletOfTheDay(night: boolean) {
  const list = night ? NIGHT_COUPLETS : MORNING_COUPLETS;
  const day = Math.floor(logicalDate().getTime() / 86_400_000);
  return list[day % list.length];
}
