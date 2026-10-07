"use client";

import { useState } from "react";
import type { Echo, TaskCard } from "@/lib/ai";
import type { EchoStreamLine } from "@/app/api/echo/route";
import { LIMITS } from "@/lib/limits";
import { dateKey, load, save, tomorrowKey } from "@/lib/storage";
import CardArt from "./CardArt";

export type JournalEntry = Echo & { goodThings: string[]; reflection: string; task?: string };

/** Posts the journal and calls `onText` with the reply as it streams in. Resolves with the final Echo. */
async function requestEcho(body: unknown, onText: (text: string) => void): Promise<Echo> {
  const res = await fetch("/api/echo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    const { message } = (await res.json()) as { message: string };
    throw new Error(message);
  }
  if (!res.ok || !res.body) throw new Error("送出失敗了，你寫的內容都還在，請稍後再按一次。");

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      if (!raw) continue;
      const line = JSON.parse(raw) as EchoStreamLine;
      if (line.type === "delta") onText((text += line.text));
      else if (line.type === "reset") onText((text = ""));
      else return line.echo;
    }
  }
  throw new Error("連線中斷了，你寫的內容都還在，請再按一次。");
}

export default function NightJournal({ todayCard }: { todayCard: TaskCard | null }) {
  const today = dateKey();
  const [saved, setSaved] = useState<JournalEntry | null>(() => load<JournalEntry>(`night:${today}`));
  const [goodThings, setGoodThings] = useState(["", "", ""]);
  const [reflection, setReflection] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null); // reply text while it is being written
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false); // reopened the form after tonight was already saved

  const sending = streaming !== null;
  const canSend = !sending && (reflection.trim() || goodThings.some((t) => t.trim()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setStreaming("");
    setError(null);
    const task = todayCard?.task.slice(0, LIMITS.task);
    try {
      const echo = await requestEcho({ task, reflection, goodThings }, setStreaming);
      const entry: JournalEntry = { ...echo, goodThings, reflection, task };
      save(`night:${today}`, entry);
      save(`tomorrow:${tomorrowKey()}`, echo.tomorrowCard);
      setSaved(entry);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送出失敗了，請稍後再試。"); // inputs stay filled
    } finally {
      setStreaming(null);
    }
  }

  if (sending || (saved && !editing)) {
    const result = sending ? null : saved; // while re-sending, show the new reply as it streams
    return (
      <div className="mx-auto w-full max-w-sm space-y-14" aria-live="polite">
        <section className="animate-rise">
          <SectionLabel title="回音" note="寫給今天的你" />
          <p className="mt-6 min-h-24 whitespace-pre-wrap text-[1.15rem] font-light leading-[2.1] tracking-wide">
            {result ? result.reply : streaming || <span className="text-moon/50">正在細細讀你寫下的一天</span>}
            {!result && <span className="ml-1 inline-block h-5 w-px animate-pulse bg-sun align-middle" />}
          </p>
        </section>

        <section className="animate-rise [animation-delay:200ms]">
          <SectionLabel title="明早" note="留給明天的一張卡" />
          <div className="mt-6 flex items-center gap-6">
            <div className="h-36 w-27 shrink-0 overflow-hidden rounded-[2px] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]">
              {result ? (
                <CardArt seed={result.tomorrowCard.title} className="size-full animate-fade" />
              ) : (
                <div className="size-full animate-pulse bg-moon/10" />
              )}
            </div>
            <div>
              {result ? (
                <>
                  <h3 className="text-xl tracking-wide">{result.tomorrowCard.title}</h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-moon/60">明天醒來，它會在這裡等你翻開。</p>
                </>
              ) : (
                <p className="text-sm font-light leading-relaxed text-moon/60">正在把這段話，收成明早的一張卡片。</p>
              )}
            </div>
          </div>
        </section>

        {result && (
          <div className="space-y-8 text-center">
            <p className="animate-fade font-brush text-4xl text-moon/75 [animation-delay:500ms]">好夢</p>
            <button
              type="button"
              onClick={() => {
                setGoodThings([0, 1, 2].map((i) => result.goodThings[i] ?? ""));
                setReflection(result.reflection);
                setEditing(true);
              }}
              className="border-b border-moon/25 pb-0.5 font-sans text-xs tracking-[0.25em] text-moon/50 transition hover:border-moon/60 hover:text-moon/80"
            >
              修改今晚的日記
            </button>
          </div>
        )}
      </div>
    );
  }

  const line =
    "w-full border-b border-moon/20 bg-transparent text-[1.05rem] font-light text-moon outline-none transition placeholder:font-sans placeholder:text-sm placeholder:text-moon/30 focus:border-sun/70";

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-sm animate-rise space-y-12">
      {todayCard && (
        <div>
          <p className="font-sans text-xs tracking-[0.3em] text-moon/50">今日之卡</p>
          <p className="mt-3 border-l border-sun/50 pl-4 text-[15px] font-light leading-relaxed text-moon/75">
            {todayCard.task}
          </p>
        </div>
      )}

      <fieldset>
        <SectionLabel title="三件好事" note="今天，有哪些小小的美好" />
        <div className="mt-6 space-y-5">
          {goodThings.map((value, i) => (
            <label key={i} className="flex items-baseline gap-4">
              <span className="w-5 shrink-0 text-lg font-light text-sun/80">{["一", "二", "三"][i]}</span>
              <input
                value={value}
                onChange={(e) => setGoodThings((prev) => prev.map((t, j) => (j === i ? e.target.value : t)))}
                maxLength={LIMITS.goodThing}
                placeholder={["早餐店阿姨叫我帥哥／美女", "同事揪團訂下午茶", "再小的事，都算數"][i]}
                className={`${line} py-2`}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <div className="flex items-baseline justify-between">
          <SectionLabel title="心得" note="做完今天的事，有什麼感受" />
          <span className="font-latin text-sm text-moon/40">
            {reflection.length}/{LIMITS.reflection}
          </span>
        </div>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          maxLength={LIMITS.reflection}
          rows={3}
          placeholder="選填。想到什麼，就寫什麼。"
          className={`${line} mt-4 resize-none leading-loose`}
        />
      </label>

      <div className="space-y-5">
        {error && (
          <p role="alert" className="text-center text-sm font-light text-dew">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!canSend}
          className="w-full border border-moon/40 py-3.5 font-sans text-sm tracking-[0.5em] text-moon transition hover:bg-moon hover:text-night disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-moon"
        >
          送出
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="block w-full text-center font-sans text-xs tracking-[0.25em] text-moon/50 transition hover:text-moon/80"
          >
            不改了，回到回音
          </button>
        )}
        <p className="text-center font-sans text-[11px] font-light leading-relaxed text-moon/40">
          送出後，你寫的內容會傳給 Claude（Anthropic 的 AI）產生回饋。
          <br />
          日記本身只存在這個瀏覽器裡，不會存到我們的伺服器。
        </p>
      </div>
    </form>
  );
}

function SectionLabel({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-base tracking-[0.3em] text-sun/90">{title}</span>
      <span className="font-sans text-xs font-light tracking-[0.2em] text-moon/45">{note}</span>
    </div>
  );
}
