"use client";

import Link from "next/link";
import { useState } from "react";
import { loadAll } from "@/lib/storage";
import { useIsClient } from "@/lib/useIsClient";
import type { JournalEntry } from "./NightJournal";
import Ambience from "./Ambience";
import CardArt from "./CardArt";
import PosterHeader from "./PosterHeader";
import { fullDate } from "@/lib/zhDate";

/** "2026-10-07" → 二〇二六年十月七日 · 星期三 */
function formatDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return fullDate(new Date(y, m - 1, d));
}

export default function Collection() {
  const isClient = useIsClient();
  return (
    <main className="relative min-h-screen px-6 pb-20 pt-10 text-ink">
      <Ambience night={false} />
      <div className="mx-auto max-w-sm">
        <nav className="flex animate-fade justify-between">
          <p className="text-sm tracking-[0.2em] text-ink-soft">收藏冊</p>
          <Link
            href="/"
            className="border-b border-ink/25 pb-0.5 font-sans text-xs tracking-[0.25em] text-ink-soft transition hover:border-moss hover:text-moss"
          >
            回到今天
          </Link>
        </nav>
        <PosterHeader glyph="藏" label="收藏" couplet={["拾葉成冊", "收好日子"]} seal="珍藏" className="mt-8" />
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
      <div className="mt-14 animate-rise border-t border-ink/15 pt-8">
        <p className="text-lg font-light">這裡還是空白的。</p>
        <p className="mt-2 font-light leading-relaxed text-ink-soft">今晚寫下三件小小的好事，就能收下第一張卡片。</p>
      </div>
    );
  }

  return (
    <>
      <p className="mt-10 flex items-baseline gap-3 border-t border-ink/15 pt-4">
        <span className="font-latin text-3xl">{String(entries.length).padStart(2, "0")}</span>
        <span className="font-sans text-xs tracking-[0.25em] text-ink-soft">張卡片</span>
      </p>

      <ul className="mt-10 space-y-16">
        {entries.map(([date, entry], index) => {
          const open = openDate === date;
          const things = entry.goodThings.filter((t) => t.trim());
          const no = String(entries.length - index).padStart(3, "0");
          return (
            <li key={date} className="animate-rise" style={{ animationDelay: `${Math.min(index, 6) * 90}ms` }}>
              <button
                type="button"
                onClick={() => setOpenDate(open ? null : date)}
                aria-expanded={open}
                className="group block w-full text-left"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-[2px] shadow-[0_30px_60px_-30px_rgba(42,37,33,0.5)]">
                  <CardArt seed={entry.tomorrowCard.title} className="size-full transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
                </div>
                <div className="mt-5 flex items-baseline justify-between">
                  <p className="font-latin text-sm italic text-moss">No. {no}</p>
                  <p className="font-sans text-xs font-light tracking-[0.15em] text-ink-faint">{formatDate(date)}</p>
                </div>
                <h2 className="mt-2 text-xl tracking-wide">{entry.tomorrowCard.title}</h2>
                <p className="mt-3 font-light leading-[1.9]">{entry.tomorrowCard.task}</p>
                <p className="mt-3 flex gap-3 font-sans text-[13px] font-light leading-relaxed text-ink-soft">
                  <span className="mt-[0.7em] h-px w-5 shrink-0 bg-ink-soft/50" />
                  {entry.tomorrowCard.hint}
                </p>
                <p className="mt-5 font-sans text-xs tracking-[0.25em] text-ink-faint underline-offset-4 group-hover:text-moss group-hover:underline">
                  {open ? "收起那晚的日記" : "讀那晚的日記"}
                </p>
              </button>

              {open && (
                <div className="mt-6 animate-rise space-y-6 border-l border-moss/40 pl-5">
                  {entry.task && <Note label="那天的任務">{entry.task}</Note>}
                  {things.length > 0 && (
                    <Note label="那天的好事">
                      <ol className="space-y-1">
                        {things.map((t, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="text-moss/80">{["一", "二", "三"][i]}</span>
                            {t}
                          </li>
                        ))}
                      </ol>
                    </Note>
                  )}
                  {entry.reflection && <Note label="任務的感受">{entry.reflection}</Note>}
                  <Note label="幸福回音">
                    <span className="leading-[2]">{entry.reply}</span>
                  </Note>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Note({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-sans text-[11px] tracking-[0.3em] text-ink-faint">{label}</p>
      <div className="mt-2 text-[15px] font-light leading-relaxed">{children}</div>
    </div>
  );
}
