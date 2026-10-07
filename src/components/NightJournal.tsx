"use client";

import { useState } from "react";
import type { Echo, TaskCard } from "@/lib/ai";
import { dateKey, load, save, tomorrowKey } from "@/lib/storage";

type Saved = Echo & { goodThings: string[]; reflection: string };

export default function NightJournal({ todayCard }: { todayCard: TaskCard | null }) {
  const today = dateKey();
  const [saved, setSaved] = useState<Saved | null>(() => load<Saved>(`night:${today}`));
  const [goodThings, setGoodThings] = useState(["", "", ""]);
  const [reflection, setReflection] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = !sending && (reflection.trim() || goodThings.some((t) => t.trim()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    try {
      const res = await fetch("/api/echo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: todayCard?.task, reflection, goodThings }),
      });
      const echo = (await res.json()) as Echo;
      const entry: Saved = { ...echo, goodThings, reflection };
      save(`night:${today}`, entry);
      save(`tomorrow:${tomorrowKey()}`, echo.tomorrowCard);
      setSaved(entry);
    } finally {
      setSending(false);
    }
  }

  if (saved) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-6">
        <section className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/15">
          <p className="mb-3 text-xs tracking-widest text-indigo-300">✨ 幸福回音牆</p>
          <p className="leading-relaxed text-indigo-50">{saved.reply}</p>
        </section>

        <section className="rounded-3xl bg-gradient-to-br from-indigo-400/30 to-fuchsia-400/20 p-6 ring-1 ring-white/20">
          <p className="text-xs tracking-widest text-fuchsia-200">🎁 明早的專屬卡片（已收藏）</p>
          <h3 className="mt-2 text-xl font-bold text-white">{saved.tomorrowCard.title}</h3>
          <p className="mt-1 text-sm text-indigo-100/80">明天早上打開時，它會在這裡等你翻開。</p>
        </section>

        <p className="text-center text-sm text-indigo-200/70">晚安，好好休息 🌙</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-sm space-y-5">
      {todayCard && (
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-indigo-100/80 ring-1 ring-white/10">
          今天的任務：{todayCard.task}
        </div>
      )}

      <label className="block">
        <span className="text-sm text-indigo-200">完成任務的心得（選填）</span>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={3}
          placeholder="做了之後，有什麼感覺？"
          className="mt-2 w-full resize-none rounded-2xl bg-white/10 p-4 text-indigo-50 placeholder:text-indigo-200/40 ring-1 ring-white/15 outline-none focus:ring-indigo-300"
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm text-indigo-200">今天發生的 3 件好事</legend>
        {goodThings.map((value, i) => (
          <input
            key={i}
            value={value}
            onChange={(e) => setGoodThings((prev) => prev.map((t, j) => (j === i ? e.target.value : t)))}
            placeholder={`${i + 1}. `}
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-indigo-50 placeholder:text-indigo-200/40 ring-1 ring-white/15 outline-none focus:ring-indigo-300"
          />
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={!canSend}
        className="w-full rounded-full bg-indigo-300 py-3 font-semibold text-indigo-950 transition hover:bg-indigo-200 disabled:opacity-40"
      >
        {sending ? "AI 正在寫回音…" : "送出，聽聽回音 ✨"}
      </button>
    </form>
  );
}
