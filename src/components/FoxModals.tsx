"use client";

import { useState, type ReactNode } from "react";
import Fox, { STAGE_NAMES, type FoxStage } from "./Fox";
import Sheet from "./Sheet";
import { CARE, STAGE_OUTFIT } from "@/lib/fox";

function Modal({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Sheet aria-label={label} className="text-center">
      {children}
    </Sheet>
  );
}

/** First visit: meet the sleeping fur ball, give it a name, learn how to care for it. */
export function FoxWelcome({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState("小福");
  const trimmed = name.trim();
  return (
    <Modal label="認識你的小狐狸">
      {/* the sleeping fox fills only the lower half of its drawing; pull it up into the empty top */}
      <div className="-mt-20 flex justify-center">
        <Fox stage={1} pose="sleep" size={160} animated />
      </div>
      <h2 className="mt-1 text-xl tracking-[0.15em]">一隻小狐狸來了</h2>
      <p className="mt-3 text-sm font-light leading-loose text-ink-soft">
        牠縮成一顆小毛球，在你身邊睡著了。
        <br />
        幫牠取個名字吧。
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed) onDone(trimmed);
        }}
        className="mt-5"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={6}
          aria-label="小狐狸的名字"
          onFocus={(e) => e.target.select()}
          className="w-40 border-b border-ink/30 bg-transparent py-1.5 text-center text-lg tracking-[0.2em] outline-none focus:border-moss"
        />
        <p className="mt-2 font-sans text-xs font-light text-ink-faint">可以改成你喜歡的名字</p>
        <ul className="mt-6 space-y-1.5 text-sm font-light leading-relaxed text-ink-soft">
          <li>早上完成任務，給牠<span className="text-ink">{CARE.task.label}</span></li>
          <li>一起呼吸三十秒，給牠<span className="text-ink">{CARE.breath.label}</span></li>
          <li>晚上寫下三件好事，給牠<span className="text-ink">{CARE.journal.label}</span></li>
        </ul>
        <p className="mt-5 text-xs font-light leading-relaxed text-ink-faint">
          牠會慢慢長大。
          <br />
          就算你幾天沒來，牠也只是睡著等你。
        </p>
        <button
          type="submit"
          disabled={!trimmed}
          className="mt-6 w-full border border-ink/40 py-2.5 font-sans text-sm tracking-[0.4em] transition hover:bg-ink hover:text-paper disabled:opacity-30"
        >
          開始
        </button>
      </form>
    </Modal>
  );
}

/** Shown once each time the fox reaches a new stage. */
export function FoxGrewUp({ name, stage, onClose }: { name: string; stage: FoxStage; onClose: () => void }) {
  return (
    <Modal label={`${name}長大了`}>
      <div className="relative flex justify-center">
        <div className="absolute inset-x-10 inset-y-2 rounded-full bg-sun/20 blur-2xl" aria-hidden />
        <span className="relative">
          <Fox stage={stage} pose="jump" size={190} animated />
        </span>
      </div>
      <p className="mt-2 font-sans text-xs tracking-[0.4em] text-moss">長大了</p>
      <h2 className="mt-2 text-xl tracking-[0.12em]">
        {name}變成{STAGE_NAMES[stage]}了！
      </h2>
      <p className="mt-2 text-sm font-light text-ink-soft">{STAGE_OUTFIT[stage]}。謝謝你每天的照顧。</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full border border-ink/40 py-2.5 font-sans text-sm tracking-[0.4em] transition hover:bg-ink hover:text-paper"
      >
        好開心
      </button>
    </Modal>
  );
}
