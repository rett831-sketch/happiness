"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadAll } from "@/lib/storage";
import { useIsClient } from "@/lib/useIsClient";
import type { JournalEntry } from "./NightJournal";
import Ambience from "./Ambience";
import FreshOnShow from "./FreshOnShow";
import CardArt from "./CardArt";
import PosterHeader from "./PosterHeader";
import WeeklyLetter from "./WeeklyLetter";
import { fullDate, monthName, yearMonth } from "@/lib/zhDate";

type Entry = [date: string, entry: JournalEntry];

/** "2026-10-07" → Date */
function toDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Everything written that night, for search. */
function searchText(entry: JournalEntry) {
  return [...entry.goodThings, entry.reflection, entry.task ?? "", entry.reply, entry.tomorrowCard.title, entry.tomorrowCard.task].join("\n");
}

export default function Collection() {
  const isClient = useIsClient();
  return (
    <main className="relative min-h-screen px-6 pb-20 pt-10 text-ink">
      <Ambience night={false} />
      <div className="mx-auto max-w-sm">
        <nav className="flex animate-fade justify-between">
          <p className="text-sm tracking-[0.2em] text-ink-soft">收藏冊</p>
          <span className="flex gap-5">
            <Link
              href="/fox"
              className="border-b border-ink/25 pb-0.5 font-sans text-xs tracking-[0.25em] text-ink-soft transition hover:border-moss hover:text-moss"
            >
              小福圖鑑
            </Link>
            <Link
              href="/"
              className="border-b border-ink/25 pb-0.5 font-sans text-xs tracking-[0.25em] text-ink-soft transition hover:border-moss hover:text-moss"
            >
              回到今天
            </Link>
          </span>
        </nav>
        <PosterHeader glyph="藏" label="收藏" couplet={["拾葉成冊", "收好日子"]} seal="珍藏" className="mt-8" />
        {isClient && (
          <FreshOnShow>
            <Entries />
          </FreshOnShow>
        )}
      </div>
    </main>
  );
}

function Entries() {
  const [entries] = useState<Entry[]>(() => loadAll<JournalEntry>("night"));
  const [query, setQuery] = useState("");
  const [openDate, setOpenDate] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="mt-14 animate-rise border-t border-ink/15 pt-8">
        <p className="text-lg font-light">這裡還是空白的。</p>
        <p className="mt-2 font-light leading-relaxed text-ink-soft">今晚寫下三件小小的好事，就能收下第一張卡片。</p>
      </div>
    );
  }

  const q = query.trim();
  const shown = q ? entries.filter(([, e]) => searchText(e).includes(q)) : entries;

  // Group by month, newest first (entries are already sorted newest first).
  const months: { key: string; label: string; items: Entry[] }[] = [];
  for (const item of shown) {
    const key = item[0].slice(0, 7);
    const last = months[months.length - 1];
    if (last?.key === key) last.items.push(item);
    else months.push({ key, label: yearMonth(toDate(item[0])), items: [item] });
  }

  // Card numbers count from the first night ever, whatever is filtered.
  const numberOf = (date: string) => entries.length - entries.findIndex(([d]) => d === date);
  const openIndex = shown.findIndex(([d]) => d === openDate);

  return (
    <>
      <WeeklyLetter entries={entries} />

      <p className="mt-10 flex items-baseline gap-3 border-t border-ink/15 pt-4">
        <span className="font-latin text-3xl">{String(entries.length).padStart(2, "0")}</span>
        <span className="font-sans text-xs tracking-[0.25em] text-ink-soft">張卡片</span>
      </p>

      {/* search and month jumps stay at the top while scrolling */}
      <div className="sticky top-0 z-20 -mx-6 mt-6 bg-paper/90 px-6 pb-3 pt-3 backdrop-blur-md">
        <label className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-sm">
          <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-ink-faint" aria-hidden>
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M13 13 L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋好事，例如「蛋糕」"
            aria-label="搜尋收藏的日記"
            className="w-full bg-transparent font-sans text-sm outline-none placeholder:text-ink-faint"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="shrink-0 font-sans text-xs text-ink-soft hover:text-moss">
              清除
            </button>
          )}
        </label>
        {months.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {months.map((m) => (
              <a
                key={m.key}
                href={`#m-${m.key}`}
                className="shrink-0 rounded-full border border-ink/15 px-3 py-1 font-sans text-xs tracking-[0.15em] text-ink-soft transition hover:border-moss hover:text-moss"
              >
                {monthName(toDate(`${m.key}-01`))}
              </a>
            ))}
          </div>
        )}
      </div>

      {q && (
        <p className="mt-4 font-sans text-xs tracking-[0.15em] text-ink-soft">
          {shown.length ? `找到 ${shown.length} 晚寫過「${q}」` : `沒有找到寫過「${q}」的日子`}
        </p>
      )}

      {months.map((m) => (
        <section key={m.key} id={`m-${m.key}`} className="scroll-mt-32 pt-8">
          <h2 className="mb-4 flex items-baseline gap-3">
            <span className="tracking-[0.2em]">{m.label}</span>
            <span className="h-px flex-1 bg-ink/15" />
            <span className="font-sans text-xs text-ink-faint">{m.items.length} 張</span>
          </h2>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5">
            {m.items.map(([date, entry]) => {
              const match = q ? [...entry.goodThings, entry.reflection].find((t) => t.includes(q)) : null;
              return (
                <li key={date}>
                  <button type="button" onClick={() => setOpenDate(date)} className="group block w-full text-left">
                    <div className="aspect-[3/4] overflow-hidden rounded-[2px] shadow-[0_12px_24px_-14px_rgba(42,37,33,0.55)]">
                      <CardArt seed={entry.tomorrowCard.title} className="size-full transition-transform duration-700 group-hover:scale-[1.05]" />
                    </div>
                    <p className="mt-2 font-sans text-[11px] text-ink-faint">{toDate(date).getDate()} 日</p>
                    <p className="truncate text-[13px]">{entry.tomorrowCard.title}</p>
                    {match && <p className="mt-0.5 line-clamp-2 font-sans text-[11px] font-light leading-snug text-moss">{match}</p>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {openIndex >= 0 && (
        <CardDetail
          item={shown[openIndex]}
          no={numberOf(shown[openIndex][0])}
          // shown is newest first: "previous night" is the next item
          onPrev={openIndex < shown.length - 1 ? () => setOpenDate(shown[openIndex + 1][0]) : undefined}
          onNext={openIndex > 0 ? () => setOpenDate(shown[openIndex - 1][0]) : undefined}
          onClose={() => setOpenDate(null)}
        />
      )}
    </>
  );
}

/** One night's card, full size, with everything written that night. */
function CardDetail({
  item: [date, entry],
  no,
  onPrev,
  onNext,
  onClose,
}: {
  item: Entry;
  no: number;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, onPrev, onNext]);

  const things = entry.goodThings.filter((t) => t.trim());
  const step = "font-sans text-xs tracking-[0.2em] text-ink-soft disabled:opacity-25 enabled:hover:text-moss";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal aria-label={fullDate(toDate(date))}>
      <div className="mx-auto min-h-full max-w-sm px-4 py-8">
        <article key={date} className="animate-rise rounded-[1.25rem] bg-paper p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <button type="button" onClick={onPrev} disabled={!onPrev} className={step}>
              ‹ 前一晚
            </button>
            <button type="button" onClick={onClose} className="font-sans text-xs tracking-[0.2em] text-ink-soft hover:text-moss">
              關閉
            </button>
            <button type="button" onClick={onNext} disabled={!onNext} className={step}>
              後一晚 ›
            </button>
          </div>

          <div className="mt-5 aspect-[3/4] overflow-hidden rounded-[2px] shadow-[0_30px_60px_-30px_rgba(42,37,33,0.5)]">
            <CardArt seed={entry.tomorrowCard.title} className="size-full" />
          </div>
          <div className="mt-5 flex items-baseline justify-between">
            <p className="font-latin text-sm italic text-moss">No. {String(no).padStart(3, "0")}</p>
            <p className="font-sans text-xs font-light tracking-[0.1em] text-ink-faint">{fullDate(toDate(date))}</p>
          </div>
          <h2 className="mt-2 text-xl tracking-wide">{entry.tomorrowCard.title}</h2>
          <p className="mt-3 font-light leading-[1.9]">{entry.tomorrowCard.task}</p>
          <p className="mt-3 flex gap-3 font-sans text-[13px] font-light leading-relaxed text-ink-soft">
            <span className="mt-[0.7em] h-px w-5 shrink-0 bg-ink-soft/50" />
            {entry.tomorrowCard.hint}
          </p>

          <div className="mt-8 space-y-6 border-l border-moss/40 pl-5">
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
        </article>
      </div>
    </div>
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
