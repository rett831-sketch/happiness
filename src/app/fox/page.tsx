import type { Metadata } from "next";
import { Suspense } from "react";
import FoxBook from "@/components/FoxBook";

export const metadata: Metadata = {
  title: "小福圖鑑 · 幸福練習課",
};

// ?show=egg-moon (from a "just found" notice) scrolls to that item; ?demo shows the demo panel.
// Read here rather than from window.location, which isn't updated yet when arriving through a <Link>.
// The page shell stays prerendered; only the part reading the URL waits for the request.
export default function FoxPage({ searchParams }: PageProps<"/fox">) {
  return (
    <Suspense fallback={<FoxBook />}>
      <FoxBookFor searchParams={searchParams} />
    </Suspense>
  );
}

async function FoxBookFor({ searchParams }: Pick<PageProps<"/fox">, "searchParams">) {
  const params = await searchParams;
  const show = typeof params.show === "string" ? params.show : null;
  return <FoxBook show={show} demo={params.demo !== undefined} />;
}
