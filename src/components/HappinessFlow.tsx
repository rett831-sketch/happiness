"use client";

import { useEffect, useState } from "react";
import type { TaskCard as Card } from "@/lib/ai";
import Link from "next/link";
import { useIsClient } from "@/lib/useIsClient";
import { DAY_START_HOUR, dateKey, load, logicalDate, save } from "@/lib/storage";
import TaskCard from "./TaskCard";
import BreathTimer from "./BreathTimer";
import NightJournal from "./NightJournal";
import Ambience from "./Ambience";
import PosterHeader from "./PosterHeader";
import { monthDay, monthDayWeekday } from "@/lib/zhDate";

type Mode = "morning" | "night";
type StoredCard = { card: Card; fromLastNight: boolean };

// Morning from DAY_START_HOUR (05:00) to 16:59, night otherwise.
const modeForNow = (): Mode => {
  const h = new Date().getHours();
  return h >= DAY_START_HOUR && h < 17 ? "morning" : "night";
};

// Open-Meteo WMO weather codes → short description.
function describeWeather(code: number, temp: number) {
  const sky =
    code === 0 ? "晴朗" :
    code <= 3 ? "多雲" :
    code <= 48 ? "有霧" :
    code <= 67 || (code >= 80 && code <= 82) ? "下雨" :
    code <= 77 || code === 85 || code === 86 ? "下雪" :
    "雷雨";
  return `${sky}，${Math.round(temp)}°C`;
}

async function fetchWeather(): Promise<string | undefined> {
  if (!("geolocation" in navigator)) return undefined;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 3_600_000 }),
    );
    const { latitude, longitude } = pos.coords;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`,
    );
    const data = await res.json();
    return describeWeather(data.current.weather_code, data.current.temperature_2m);
  } catch {
    return undefined; // permission denied or offline: weekday alone is enough
  }
}

// Last night's reward card becomes this morning's card.
function loadTodayCard(): StoredCard | null {
  const key = dateKey();
  const existing = load<StoredCard>(`card:${key}`);
  if (existing) return existing;
  const gifted = load<Card>(`tomorrow:${key}`);
  if (!gifted) return null;
  const stored = { card: gifted, fromLastNight: true };
  save(`card:${key}`, stored);
  return stored;
}

// Time of day and localStorage only exist in the browser, so skip server rendering.
export default function HappinessFlow() {
  const isClient = useIsClient();
  if (!isClient) return <main className="min-h-screen bg-amber-50" />;
  return <Flow />;
}

function Flow() {
  const [mode, setMode] = useState<Mode>(modeForNow);
  const [today, setToday] = useState<StoredCard | null>(loadTodayCard);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Draw a new card only in the morning, so opening the app at night never triggers it.
  useEffect(() => {
    if (today || mode !== "morning") return;
    let cancelled = false;
    (async () => {
      try {
        const weather = await fetchWeather();
        const res = await fetch("/api/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weekdayIndex: logicalDate().getDay(), weather }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { card, source } = (await res.json()) as { card: Card; source: "ai" | "local" };
        const stored = { card, fromLastNight: false };
        // Keep only AI cards, so a temporary AI failure doesn't lock in the built-in card all day.
        if (source === "ai") save(`card:${dateKey()}`, stored);
        if (!cancelled) setToday(stored);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [today, mode, attempt]);

  const night = mode === "night";
  const day = logicalDate();
  const couplet = coupletOfTheDay(night);
  const dateLabel = monthDay(day);
  const link = `font-sans text-xs tracking-[0.25em] border-b pb-0.5 transition ${
    night ? "border-moon/30 text-moon/80 hover:text-moon" : "border-ink/25 text-ink-soft hover:text-moss hover:border-moss"
  }`;

  return (
    <main className={`relative min-h-screen px-6 pb-20 pt-10 ${night ? "text-moon" : "text-ink"}`}>
      <Ambience night={night} />

      <nav className="mx-auto flex max-w-sm animate-fade items-center justify-between">
        <p className={`text-sm tracking-[0.2em] ${night ? "text-moon/60" : "text-ink-soft"}`}>{monthDayWeekday(day)}</p>
        <div className="flex gap-5">
          <button type="button" onClick={() => setMode(night ? "morning" : "night")} className={link} title="手動切換早晨 / 夜間">
            {night ? "晨" : "夜"}
          </button>
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
        className="mb-12 mt-8"
      />

      {night ? (
        <NightJournal todayCard={today?.card ?? null} />
      ) : (
        <div className="space-y-14">
          <TaskCard
            card={today?.card ?? null}
            seed={dateKey()}
            dateLabel={dateLabel}
            failed={failed}
            badge={today?.fromLastNight ? "昨夜留箋" : undefined}
          />
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
          <BreathTimer />
        </div>
      )}
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
