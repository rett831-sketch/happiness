"use client";

import { useState } from "react";
import type { KeyProblem, Weekly } from "@/lib/ai";
import { aiHeaders } from "@/lib/apiKey";
import { daysBetween, loadFox, stageFor } from "@/lib/fox";
import { dateKey, load, save } from "@/lib/storage";
import Fox from "./Fox";
import type { JournalEntry } from "./NightJournal";

type SavedWeekly = Weekly & { upTo: string; count: number; source: "ai" | "local" };

/** The fox's letter about the past week of journal entries, kept until new entries arrive. */
export default function WeeklyLetter({ entries }: { entries: [string, JournalEntry][] }) {
  const today = dateKey();
  const week = entries.filter(([d]) => {
    const ago = daysBetween(d, today);
    return ago >= 0 && ago <= 6;
  });
  const [{ name, stage }] = useState(() => {
    const fox = loadFox();
    return { name: fox?.name ?? "小福", stage: stageFor(fox?.points ?? 0) };
  });
  const [saved, setSaved] = useState(() => load<SavedWeekly>("weekly"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyProblem, setKeyProblem] = useState<KeyProblem | undefined>();

  const upTo = week[0]?.[0];
  const current = saved && saved.upTo === upTo && saved.count === week.length ? saved : null;

  async function write() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders() },
        body: JSON.stringify({
          foxName: name,
          entries: week.map(([date, e]) => ({
            date,
            goodThings: e.goodThings.slice(0, 3),
            reflection: e.reflection || undefined,
            task: e.task,
          })),
        }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "今天已經寫很多封了，休息一下再來吧。" : "信沒有寄到，請稍後再試。");
      const data = (await res.json()) as Weekly & { source: "ai" | "local"; keyProblem?: KeyProblem };
      const next: SavedWeekly = { letter: data.letter, themes: data.themes, source: data.source, upTo: upTo!, count: week.length };
      save("weekly", next);
      setSaved(next);
      setKeyProblem(data.keyProblem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "信沒有寄到，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  if (week.length === 0) {
    return (
      <section className="mt-10 animate-rise rounded-[1.5rem] bg-card/80 p-5">
        <p className="text-base tracking-[0.2em]">{name}的週報</p>
        <p className="mt-2 text-sm font-light leading-relaxed text-ink-soft">這週還沒有日記。寫下幾件好事後，{name}就會寫一封信給你。</p>
      </section>
    );
  }

  return (
    <section className="mt-10 animate-rise">
      <div className="flex items-end gap-2">
        <Fox stage={stage} pose={current ? "heart" : loading ? "tilt" : "card"} size={96} animated />
        <div className="mb-3">
          <p className="text-base tracking-[0.2em]">{name}的週報</p>
          <p className="mt-0.5 font-sans text-xs text-ink-soft">這週你寫了 {week.length} 天的日記</p>
        </div>
      </div>

      {current ? (
        <article className="mt-2 rounded-[1.25rem] bg-card p-6 shadow-[0_20px_40px_-28px_rgba(59,58,50,0.5)]">
          <p className="whitespace-pre-wrap text-[15px] font-light leading-[2]">{current.letter}</p>
          <p className="mt-3 text-right text-sm tracking-[0.2em] text-ink-soft">——{name}</p>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
            {current.themes.map((t) => (
              <span key={t} className="rounded-full bg-moss/10 px-3 py-1 font-sans text-xs text-moss">
                {t}
              </span>
            ))}
          </div>
          {current.source === "local" && (
            <p className={`mt-3 font-sans text-[11px] font-light ${keyProblem ? "text-seal" : "text-ink-faint"}`}>
              {keyProblem === "invalid"
                ? "你的 AI 金鑰無法使用，這封是內建的信。"
                : keyProblem === "quota"
                  ? "你的 AI 帳號額度不足，這封是內建的信。"
                  : `這是內建的信。在首頁設定 AI 金鑰後，${name}會寫得更貼近你。`}
            </p>
          )}
        </article>
      ) : (
        <div className="mt-2 rounded-[1.25rem] bg-card/80 p-5 text-center">
          <p className="text-sm font-light text-ink-soft">
            {saved ? `有新的日記了，要請${name}重寫這週的信嗎？` : `${name}讀完了你這週的日記，想寫一封信給你。`}
          </p>
          <button
            type="button"
            onClick={write}
            disabled={loading}
            className="mt-4 rounded-full bg-moss px-7 py-2.5 font-sans text-sm tracking-[0.3em] text-paper shadow-md transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? `${name}正在寫信⋯⋯` : saved ? "請牠重寫" : "打開這週的信"}
          </button>
          {error && (
            <p role="alert" className="mt-3 text-sm text-seal">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
