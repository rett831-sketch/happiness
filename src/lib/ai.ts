import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { partialString } from "./partialJson";

export const TaskCardSchema = z.object({
  title: z.string().describe("卡片標題，6–12 個字"),
  task: z.string().describe("今日幸福任務，一句話、具體可執行、5 分鐘內可完成"),
  hint: z.string().describe("一句溫柔的小提醒或為什麼這麼做"),
});
export type TaskCard = z.infer<typeof TaskCardSchema>;

const EchoSchema = z.object({
  reply: z.string().describe("給用戶的溫暖回饋，80–150 字"),
  tomorrowCard: TaskCardSchema,
});
export type Echo = z.infer<typeof EchoSchema>;

const SYSTEM = `你是「happiness」的幸福教練，語氣溫暖、簡潔、不說教，使用繁體中文（台灣用語）。
任務要小、具體、能在日常中順手完成（通勤、走路、吃飯、工作空檔），不需花錢、不需特殊道具。
文字要安靜、有質感，像一張好看的明信片；不要使用 emoji 或顏文字。`;

const client = new Anthropic();

async function ask<T extends z.ZodType>(schema: T, prompt: string): Promise<z.infer<T>> {
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`No usable output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output;
}

export function generateTaskCard(ctx: { weekday: string; weather?: string }) {
  return ask(
    TaskCardSchema,
    `今天是${ctx.weekday}${ctx.weather ? `，天氣：${ctx.weather}` : ""}。
請依照今天的星期與天氣，設計一張「今日幸福任務卡」。
範例：「今天走路時，刻意觀察 3 個綠色的東西」。`,
  );
}

export type EchoEvent = { type: "delta"; text: string } | { type: "reset" };

/**
 * Streams the reply text as it is written (via `onEvent`), then resolves with the full Echo.
 * `reset` means the reply restarted (e.g. a fallback model took over) and shown text should be cleared.
 */
export async function streamEcho(
  ctx: { task?: string; reflection?: string; goodThings: string[] },
  onEvent: (event: EchoEvent) => void,
): Promise<Echo> {
  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(EchoSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: echoPrompt(ctx) }],
  });

  let json = "";
  let sent = 0;
  for await (const event of stream) {
    if (event.type === "content_block_start" && event.content_block.type === "text") {
      json = "";
      if (sent > 0) onEvent({ type: "reset" });
      sent = 0;
    } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      json += event.delta.text;
      const reply = partialString(json, "reply");
      if (reply.length > sent) {
        onEvent({ type: "delta", text: reply.slice(sent) });
        sent = reply.length;
      }
    }
  }

  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal" || !message.parsed_output) {
    throw new Error(`No usable output (stop_reason: ${message.stop_reason})`);
  }
  return message.parsed_output;
}

function echoPrompt(ctx: { task?: string; reflection?: string; goodThings: string[] }) {
  const things = ctx.goodThings.filter(Boolean).map((t, i) => `${i + 1}. ${t}`).join("\n");
  return `這是用戶今晚的感恩日記。
今日早晨任務：${ctx.task || "（無）"}
任務心得：${ctx.reflection || "（未填寫）"}
今天的好事：
${things || "（未填寫）"}

1. reply：針對他寫下的具體內容，給一段溫暖的正向回饋（點出他做得好的地方，不要空泛稱讚）。
2. tomorrowCard：把這段回饋轉化成一張「明早的專屬卡片」，任務要延續他今天的好事或心得。`;
}
