"use client";

import { useEffect, useState } from "react";
import type { TaskCard as Card } from "@/lib/ai";
import Link from "next/link";
import { useIsClient } from "@/lib/useIsClient";
import { DAY_START_HOUR, dateKey, load, logicalDate, save } from "@/lib/storage";
import TaskCard from "./TaskCard";
import BreathTimer from "./BreathTimer";
import NightJournal from "./NightJournal";

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

  return (
    <main
      className={`min-h-screen px-4 pb-16 pt-10 transition-colors duration-700 ${
        night
          ? "bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-indigo-50"
          : "bg-gradient-to-b from-amber-50 via-orange-50 to-sky-50 text-stone-800"
      }`}
    >
      <header className="mx-auto mb-8 flex max-w-sm items-start justify-between gap-3">
        <div>
          <p className={`text-sm ${night ? "text-indigo-300" : "text-orange-500"}`}>
            {logicalDate().toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" })}
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            {night ? "🌙 晚安，回顧今天吧" : "☀️ 早安，啟動今天的專注"}
          </h1>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setMode(night ? "morning" : "night")}
            className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
              night ? "ring-white/20 hover:bg-white/10" : "ring-stone-300 hover:bg-white"
            }`}
            title="手動切換早晨 / 夜間"
          >
            {night ? "☀️ 早晨" : "🌙 夜間"}
          </button>
          <Link
            href="/collection"
            className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
              night ? "ring-white/20 hover:bg-white/10" : "ring-stone-300 hover:bg-white"
            }`}
          >
            📚 收藏冊
          </Link>
        </div>
      </header>

      {night ? (
        <NightJournal todayCard={today?.card ?? null} />
      ) : (
        <div className="space-y-8">
          <TaskCard
            card={today?.card ?? null}
            failed={failed}
            badge={today?.fromLastNight ? "🎁 昨晚為你準備的專屬卡片" : undefined}
          />
          {failed && (
            <div className="text-center">
              <p className="text-sm text-stone-500">連線好像不太順，卡片沒抽到。</p>
              <button
                type="button"
                onClick={() => {
                  setFailed(false);
                  setAttempt((n) => n + 1);
                }}
                className="mt-2 rounded-full bg-stone-800 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700"
              >
                重新抽卡
              </button>
            </div>
          )}
          <BreathTimer />
        </div>
      )}
    </main>
  );
}
