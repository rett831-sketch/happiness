"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { TaskCard as Card } from "@/lib/ai";
import { dateKey, load, save } from "@/lib/storage";
import TaskCard from "./TaskCard";
import BreathTimer from "./BreathTimer";
import NightJournal from "./NightJournal";

type Mode = "morning" | "night";
type StoredCard = { card: Card; fromLastNight: boolean };

// Morning 05:00–16:59, night otherwise.
const modeForNow = (): Mode => {
  const h = new Date().getHours();
  return h >= 5 && h < 17 ? "morning" : "night";
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

const subscribeNoop = () => () => {};

// Time of day and localStorage only exist in the browser, so skip server rendering.
export default function HappinessFlow() {
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!isClient) return <main className="min-h-screen bg-amber-50" />;
  return <Flow />;
}

function Flow() {
  const [mode, setMode] = useState<Mode>(modeForNow);
  const [today, setToday] = useState<StoredCard | null>(loadTodayCard);

  useEffect(() => {
    if (today) return;
    let cancelled = false;
    (async () => {
      const weather = await fetchWeather();
      const res = await fetch("/api/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekdayIndex: new Date().getDay(), weather }),
      });
      const { card } = (await res.json()) as { card: Card };
      const stored = { card, fromLastNight: false };
      save(`card:${dateKey()}`, stored);
      if (!cancelled) setToday(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [today]);

  const night = mode === "night";
  const now = new Date();

  return (
    <main
      className={`min-h-screen px-4 pb-16 pt-10 transition-colors duration-700 ${
        night
          ? "bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-indigo-50"
          : "bg-gradient-to-b from-amber-50 via-orange-50 to-sky-50 text-stone-800"
      }`}
    >
      <header className="mx-auto mb-8 flex max-w-sm items-start justify-between">
        <div>
          <p className={`text-sm ${night ? "text-indigo-300" : "text-orange-500"}`}>
            {now.toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" })}
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            {night ? "🌙 晚安，回顧今天吧" : "☀️ 早安，啟動今天的專注"}
          </h1>
        </div>
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
      </header>

      {night ? (
        <NightJournal todayCard={today?.card ?? null} />
      ) : (
        <div className="space-y-8">
          <TaskCard
            card={today?.card ?? null}
            badge={today?.fromLastNight ? "🎁 昨晚為你準備的專屬卡片" : undefined}
          />
          <BreathTimer />
        </div>
      )}
    </main>
  );
}
