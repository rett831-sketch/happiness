import type { Metadata } from "next";
import FoxBook from "@/components/FoxBook";

export const metadata: Metadata = {
  title: "小福圖鑑 · 幸福練習課",
};

export default function FoxPage() {
  return <FoxBook />;
}
