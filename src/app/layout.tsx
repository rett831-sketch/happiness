import type { Metadata } from "next";
import { Cormorant_Garamond, Ma_Shan_Zheng, Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import "./globals.css";

// Chinese display and reading text.
const serif = Noto_Serif_TC({
  variable: "--font-serif-tc",
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  preload: false,
});

// Small UI text: labels, inputs, buttons.
const sans = Noto_Sans_TC({
  variable: "--font-sans-tc",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  preload: false,
});

// Latin accents: dates, numerals, small captions.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// Brush script for the single large character in the header (晨 / 夜).
const brush = Ma_Shan_Zheng({
  variable: "--font-ma-shan-zheng",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const description = "每天兩次的幸福小練習：早晨翻開一張任務卡，夜晚寫下三件好事。";

// The share image itself comes from app/opengraph-image.tsx.
export const metadata: Metadata = {
  title: "happiness",
  description,
  openGraph: {
    title: "happiness 幸福小練習",
    description,
    siteName: "happiness",
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "happiness 幸福小練習",
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className={`${serif.variable} ${sans.variable} ${cormorant.variable} ${brush.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
