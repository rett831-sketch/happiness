"use client";

import Link from "next/link";
import { useState } from "react";
import { loadAll } from "@/lib/storage";
import { useIsClient } from "@/lib/useIsClient";
import type { JournalEntry } from "./NightJournal";

function formatDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("zh-TW", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function Collection() {
  const isClient = useIsClient();
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-indigo-50 px-4 pb-16 pt-10 text-stone-800">
      <div className="mx-auto max-w-sm">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
          ← 回到今天
        </Link>
        <h1 className="mt-3 text-2xl font-bold">📚 幸福收藏冊</h1>
        {isClient && <Entries />}
      </div>
    </main>
  );
}

function Entries() {
  const [entries] = useState(() => loadAll<JournalEntry>("night"));
  const [openDate, setOpenDate] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="mt-10 rounded-3xl bg-white/70 p-8 text-center shadow-sm">
        <p className="text-4xl">🌱</p>
        <p className="mt-3 text-stone-600">還沒有卡片。</p>
        <p className="mt-1 text-sm text-stone-500">今晚寫下三件好事，就能收下第一張專屬卡片。</p>
      </div>
    );
  }

  return (
    <>
      <p className="mt-1 text-sm text-stone-500">
        已收集 <span className="font-semibold text-orange-500">{entries.length}</span> 張專屬卡片
      </p>

      <ul className="mt-6 space-y-4">
        {entries.map(([date, entry]) => {
          const open = openDate === date;
          const things = entry.goodThings.filter((t) => t.trim());
          return (
            <li key={date} className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setOpenDate(open ? null : date)}
                aria-expanded={open}
                className="block w-full p-5 text-left"
              >
                <p className="text-xs tracking-widest text-orange-500">{formatDate(date)} 晚上收下</p>
                <h2 className="mt-1 text-lg font-bold">{entry.tomorrowCard.title}</h2>
                <p className="mt-2 leading-relaxed text-stone-700">{entry.tomorrowCard.task}</p>
                <p className="mt-2 text-sm text-stone-500">💡 {entry.tomorrowCard.hint}</p>
                <p className="mt-3 text-xs text-stone-400">{open ? "收起當晚的日記 ▲" : "看當晚的日記 ▼"}</p>
              </button>

              {open && (
                <div className="space-y-4 border-t border-stone-100 bg-indigo-50/60 p-5 text-sm">
                  {entry.task && (
                    <p className="text-stone-500">當天任務：{entry.task}</p>
                  )}
                  {entry.reflection && (
                    <div>
                      <p className="text-xs text-stone-400">任務心得</p>
                      <p className="mt-1 text-stone-700">{entry.reflection}</p>
                    </div>
                  )}
                  {things.length > 0 && (
                    <div>
                      <p className="text-xs text-stone-400">當天的好事</p>
                      <ol className="mt-1 list-decimal space-y-1 pl-5 text-stone-700">
                        {things.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-indigo-400">✨ 幸福回音</p>
                    <p className="mt-1 leading-relaxed text-stone-700">{entry.reply}</p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
