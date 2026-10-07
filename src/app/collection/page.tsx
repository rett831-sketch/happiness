import type { Metadata } from "next";
import Collection from "@/components/Collection";

export const metadata: Metadata = {
  title: "幸福收藏冊 · happiness",
};

export default function CollectionPage() {
  return <Collection />;
}
