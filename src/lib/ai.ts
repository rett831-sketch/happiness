import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { detectProvider, KEY_HEADER, type Provider } from "./apiKey";
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

const CLAUDE_MODEL = "claude-opus-5-5";
const OPENAI_MODEL = "gpt-5.5";

// ---------------------------------------------------------------------------
// Keys: bring your own key (BYOK)
// ---------------------------------------------------------------------------

/** `site`: the key belongs to this site (from the environment), so its use is rate limited more tightly. */
export type AiAuth = { provider: Provider; apiKey: string; site?: boolean };

/**
 * The key to use for this request: the visitor's own key from the request header,
 * otherwise a key configured on the server (if the site owner set one). Null means
 * no AI: the routes answer with the built-in cards and replies.
 */
export function resolveAuth(request: Request): AiAuth | null {
  const userKey = request.headers.get(KEY_HEADER)?.trim();
  if (userKey) {
    const provider = detectProvider(userKey);
    return provider ? { provider, apiKey: userKey } : null;
  }
  if (process.env.ANTHROPIC_API_KEY) return { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY, site: true };
  if (process.env.OPENAI_API_KEY) return { provider: "openai", apiKey: process.env.OPENAI_API_KEY, site: true };
  return null;
}

/** Why a visitor's key didn't work, so the page can tell them instead of silently using built-in content. */
export type KeyProblem = "invalid" | "quota";

export function keyProblemOf(error: unknown): KeyProblem | undefined {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) return "invalid";
  if (error instanceof OpenAI.AuthenticationError || error instanceof OpenAI.PermissionDeniedError) return "invalid";
  // OpenAI reports an empty balance (insufficient_quota) as 429 too.
  if (error instanceof Anthropic.RateLimitError || error instanceof OpenAI.RateLimitError) return "quota";
  return undefined;
}

// ---------------------------------------------------------------------------
// Morning card
// ---------------------------------------------------------------------------

export async function generateTaskCard(ctx: { weekday: string; weather?: string }, auth: AiAuth): Promise<TaskCard> {
  const prompt = `今天是${ctx.weekday}${ctx.weather ? `，天氣：${ctx.weather}` : ""}。
請依照今天的星期與天氣，設計一張「今日幸福任務卡」。
範例：「今天走路時，刻意觀察 3 個綠色的東西」。`;

  if (auth.provider === "openai") {
    const response = await new OpenAI({ apiKey: auth.apiKey }).responses.parse({
      model: OPENAI_MODEL,
      instructions: SYSTEM,
      input: prompt,
      reasoning: { effort: "low" },
      text: { format: zodTextFormat(TaskCardSchema, "task_card") },
    });
    if (!response.output_parsed) throw new Error(`No usable output (status: ${response.status})`);
    return response.output_parsed;
  }

  const response = await new Anthropic({ apiKey: auth.apiKey }).beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(TaskCardSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`No usable output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output;
}

// ---------------------------------------------------------------------------
// Evening echo (streamed)
// ---------------------------------------------------------------------------

export type EchoEvent = { type: "delta"; text: string } | { type: "reset" };

/**
 * Streams the reply text as it is written (via `onEvent`), then resolves with the full Echo.
 * `reset` means the reply restarted (e.g. a fallback model took over) and shown text should be cleared.
 */
export async function streamEcho(
  ctx: { task?: string; reflection?: string; goodThings: string[]; foxName?: string },
  onEvent: (event: EchoEvent) => void,
  auth: AiAuth,
): Promise<Echo> {
  // Both providers stream the JSON answer as text; pull the "reply" field out as it grows.
  let json = "";
  let sent = 0;
  const onText = (text: string) => {
    json += text;
    const reply = partialString(json, "reply");
    if (reply.length > sent) {
      onEvent({ type: "delta", text: reply.slice(sent) });
      sent = reply.length;
    }
  };
  const restart = () => {
    json = "";
    if (sent > 0) onEvent({ type: "reset" });
    sent = 0;
  };

  if (auth.provider === "openai") {
    const stream = new OpenAI({ apiKey: auth.apiKey }).responses.stream({
      model: OPENAI_MODEL,
      instructions: SYSTEM,
      input: echoPrompt(ctx),
      reasoning: { effort: "low" },
      text: { format: zodTextFormat(EchoSchema, "echo") },
    });
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") onText(event.delta);
    }
    const response = await stream.finalResponse();
    if (!response.output_parsed) throw new Error(`No usable output (status: ${response.status})`);
    return response.output_parsed;
  }

  const stream = new Anthropic({ apiKey: auth.apiKey }).beta.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(EchoSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: echoPrompt(ctx) }],
  });
  for await (const event of stream) {
    if (event.type === "content_block_start" && event.content_block.type === "text") restart();
    else if (event.type === "content_block_delta" && event.delta.type === "text_delta") onText(event.delta.text);
  }
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal" || !message.parsed_output) {
    throw new Error(`No usable output (stop_reason: ${message.stop_reason})`);
  }
  return message.parsed_output;
}

function echoPrompt(ctx: { task?: string; reflection?: string; goodThings: string[]; foxName?: string }) {
  const things = ctx.goodThings.filter(Boolean).map((t, i) => `${i + 1}. ${t}`).join("\n");
  return `這是用戶今晚的感恩日記。
今日早晨任務：${ctx.task || "（無）"}
任務心得：${ctx.reflection || "（未填寫）"}
今天的好事：
${things || "（未填寫）"}

1. reply：針對他寫下的具體內容，給一段溫暖的正向回饋（點出他做得好的地方，不要空泛稱讚）。${
    ctx.foxName
      ? `\n   用使用者養的小狐狸「${ctx.foxName}」的口吻寫：第一人稱「我」，親切可愛但不幼稚，像一個一直陪在身邊、很珍惜他的小夥伴。`
      : ""
  }
2. tomorrowCard：把這段回饋轉化成一張「明早的專屬卡片」，任務要延續他今天的好事或心得。
   這張卡片是他隔天早上才會打開來讀的，所以要用隔天早上的角度寫：讀卡片的那天叫「今天」，寫日記的這天叫「昨天」或「昨晚」。
   不要用「明早」「明天」來指讀卡片的那天（例如寫「今天開始工作前」，不要寫「明早開始工作前」）。`;
}

// ---------------------------------------------------------------------------
// Weekly letter from the fox
// ---------------------------------------------------------------------------

const WeeklySchema = z.object({
  letter: z.string().describe("小狐狸寫給使用者的週報信，150–250 字"),
  themes: z.array(z.string()).describe("這週反覆出現的主題，1–3 個，每個 2–6 個字"),
});
export type Weekly = z.infer<typeof WeeklySchema>;

export type WeeklyEntry = { date: string; goodThings: string[]; reflection?: string; task?: string };

export async function generateWeekly(ctx: { entries: WeeklyEntry[]; foxName?: string }, auth: AiAuth): Promise<Weekly> {
  const name = ctx.foxName || "小福";
  const days = ctx.entries
    .map((e) => {
      const things = e.goodThings.filter(Boolean).join("；") || "（未填寫）";
      return `${e.date}｜好事：${things}${e.reflection ? `｜心得：${e.reflection}` : ""}${e.task ? `｜當天任務：${e.task}` : ""}`;
    })
    .join("\n");
  const prompt = `這是使用者過去一週的感恩日記：
${days}

請用他養的小狐狸「${name}」的口吻（第一人稱「我」，親切可愛但不幼稚），寫一封這週的回顧信給他。
- letter：150–250 字。具體提到他寫過的事，指出這週反覆出現的主題（例如提到家人幾次），溫暖地肯定他，最後給下週一個小小的期待。用一般段落，不要條列，不要 emoji，結尾不用署名。
- themes：1–3 個這週反覆出現的主題，每個 2–6 個字，例如「家人的陪伴」「好吃的食物」。`;

  if (auth.provider === "openai") {
    const response = await new OpenAI({ apiKey: auth.apiKey }).responses.parse({
      model: OPENAI_MODEL,
      instructions: SYSTEM,
      input: prompt,
      reasoning: { effort: "low" },
      text: { format: zodTextFormat(WeeklySchema, "weekly_letter") },
    });
    if (!response.output_parsed) throw new Error(`No usable output (status: ${response.status})`);
    return response.output_parsed;
  }

  const response = await new Anthropic({ apiKey: auth.apiKey }).beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(WeeklySchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`No usable output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output;
}
