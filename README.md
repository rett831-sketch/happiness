# happiness 幸福小練習

一個每天只需要打開兩次的幸福練習 App。

- **早上**：翻開一張「今日幸福任務卡」，再跟著 30 秒的五感呼吸靜下心來。
- **晚上**：寫下今天的三件好事，收到一段溫暖的回饋，以及一張留給明天早上的卡片。

畫面採用東方插畫風格：宣紙色調、竹簾、垂下的桂花枝、書法大字和直書對句。每張卡片都配有一幅程式自動產生的山水小畫。

## 功能

### 早晨（05:00–16:59）

- **今日幸福任務卡**：依照星期幾和當地天氣，由 AI 產生一個簡單、做得到的小任務，例如「今天走路時，刻意觀察 3 個綠色的東西」。點一下卡片就會翻面。
- **內建卡片庫**：沒有 AI 金鑰時，從 92 張內建卡片中挑選。會依季節、天氣（下雨時不出戶外任務，並出現雨天卡片）和星期幾（週一、週五、週末有專屬卡片）挑選，大約兩三個月才會重複。
- **昨夜留箋**：如果前一晚寫過日記，早上翻開的就是昨晚 AI 為你準備的那張卡片。
- **30 秒五感呼吸**：圓圈隨著吸氣、吐氣縮放，三次深呼吸中依序提示看見、聽見、觸摸、聞到、嚐到。

### 夜晚（17:00–隔天 04:59）

- **三件好事日記**：寫下今天的三件好事，也可以選填完成任務的心得。
- **幸福回音**：AI 會針對你寫的內容回饋一段話，文字邊產生邊顯示。
- **明早的卡片**：這段回饋會變成一張留給明天早上的任務卡。
- **修改今晚的日記**：送出後仍可回頭修改、重新送出。

### 收藏冊（`/collection`）

依日期列出每晚收下的卡片。點開可以重讀當晚的任務、三件好事、心得和 AI 回音。

### 其他細節

- 一天從**早上 5 點**開始計算，所以凌晨寫的日記仍算前一天晚上。
- 右上角的「晨／夜」可以手動切換模式。
- 系統開啟「減少動態效果」時，動畫會自動停止。

## 技術

- [Next.js 16](https://nextjs.org)（App Router）＋ React 19 ＋ TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- AI：[OpenAI API](https://platform.openai.com/docs)（gpt-5.5）或 [Claude API](https://docs.claude.com)（claude-opus-5-5），依使用者的金鑰自動選擇
- [Open-Meteo](https://open-meteo.com)：免費天氣資料，不需要金鑰
- 字型：思源宋體、思源黑體、Cormorant Garamond、馬善政毛筆字（皆由 Google Fonts 提供）

## 開始使用

需要先安裝 [Node.js](https://nodejs.org) 20.9 以上的版本。

```bash
npm install
npm run dev
```

然後用瀏覽器打開 <http://localhost:3000>。

### AI 金鑰（BYOK：自備金鑰）

每位使用者用自己的 AI 金鑰，費用由自己的帳號支付：

1. 點頁面上方的「**金鑰**」。
2. 貼上 OpenAI（`sk-…`）或 Claude（`sk-ant-…`）的 API Key，程式會自動判斷是哪一家。
3. 面板裡附有兩家的申請步驟。

金鑰只存在使用者自己的瀏覽器。每次呼叫時放在 `x-ai-key` request header 傳給後端，後端只用來呼叫 AI，**不儲存、不記錄**。

**沒有金鑰也可以使用**：App 會改用內建的卡片和回饋，並提示可以設定金鑰。金鑰無效或額度不足時，也會告訴使用者。

#### 站長自己的金鑰（選用）

如果想讓沒有金鑰的訪客也用 AI，可以在 `.env.local`（或 Vercel 的 Environment Variables）設定站長的金鑰，費用由站長支付：

```
OPENAI_API_KEY=sk-你的金鑰
# 或
ANTHROPIC_API_KEY=sk-ant-你的金鑰
```

使用者自己的金鑰優先；沒有時才用站長的。

> `.env.local` 已被 git 排除，不會上傳到 GitHub。請不要把金鑰寫在其他檔案裡。

### 用手機測試開發版

手機和電腦連同一個 Wi‑Fi，打開 `npm run dev` 顯示的 `Network:` 網址即可。

如果手機只看到空白頁，請把電腦的區網 IP 加進 `next.config.ts` 的 `allowedDevOrigins`。

## 部署到 Vercel

1. 到 [vercel.com](https://vercel.com) 用 GitHub 帳號登入。
2. **Add New → Project**，匯入這個 repo。
3. 使用預設設定按 **Deploy**。使用者用自己的金鑰即可使用 AI，不需要另外設定。

之後每次推送到 `master`，Vercel 都會自動重新部署。

## 資料與隱私

- **日記只存在你的瀏覽器裡**（localStorage），不會存到伺服器。換手機或清除瀏覽器資料，日記就會消失。
- 使用 AI 時，送出的日記內容會傳給金鑰所屬的 AI 服務（OpenAI 或 Anthropic）產生回饋。
- 使用者的 AI 金鑰只存在自己的瀏覽器；伺服器只用它呼叫 AI，不儲存也不記錄（錯誤紀錄只寫錯誤類型和狀態碼）。
- **不會向你要求定位權限。** 天氣是由伺服器依照連線 IP 推估的大概位置（城市等級，由 Vercel 提供）向 Open-Meteo 查詢，只在使用 AI 時才會查。本機開發版沒有這項資訊，卡片只依照星期幾產生。

## API 防護

兩個 API 路由（`/api/card`、`/api/echo`）會：

- 檢查輸入格式，並限制字數：每件好事 200 字、心得 500 字。
- 限制同一個 IP 每小時最多呼叫 10 次。

> 次數限制記在伺服器記憶體中，重新啟動就會歸零。在 Vercel 這類會同時開多個伺服器的平台上，每個伺服器各算各的，擋不住大量濫用。如果流量變大，建議改用 Redis 等共用儲存。

## 專案結構

```
src/
├── app/
│   ├── page.tsx              首頁（早晨／夜晚）
│   ├── collection/page.tsx   收藏冊
│   └── api/
│       ├── card/route.ts     產生今日任務卡
│       └── echo/route.ts     產生晚間回音與明早卡片（串流）
├── components/
│   ├── HappinessFlow.tsx     首頁主流程、早晚切換、每日對句
│   ├── PosterHeader.tsx      書法大字＋直書對句＋印章
│   ├── TaskCard.tsx          可翻面的任務卡
│   ├── BreathTimer.tsx       30 秒五感呼吸
│   ├── NightJournal.tsx      三件好事日記與回音
│   ├── Collection.tsx        收藏冊列表
│   ├── KeySettings.tsx       AI 金鑰設定面板與申請說明
│   ├── AiNotice.tsx          內建內容／金鑰問題的提示
│   ├── CardArt.tsx           卡片上自動產生的山水小畫
│   ├── Ambience.tsx          背景（山巒、晨霧、月夜、螢火蟲）
│   └── Branch.tsx / Seal.tsx 垂枝、印章
└── lib/
    ├── ai.ts                 給 AI 的提示與呼叫（OpenAI / Claude）
    ├── apiKey.ts             金鑰辨識、瀏覽器端儲存、request header
    ├── fallback.ts           沒有 AI 時的內建卡片與回饋
    ├── cardLibrary.ts        92 張內建任務卡與每日挑選規則
    ├── weather.ts            依 IP 推估位置查天氣
    ├── storage.ts            localStorage 存取與「5 點換日」
    ├── rateLimit.ts          頻率限制
    ├── limits.ts             字數上限
    ├── landscape.ts          山稜線產生器
    └── zhDate.ts             中文數字日期
```
