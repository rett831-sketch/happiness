"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";

/**
 * Next.js (with cacheComponents) keeps up to three visited pages alive but hidden, and shows them
 * again with their old state. Our pages read localStorage once when they mount, so a page shown
 * again would miss what changed meanwhile (a pose collected on the home page, say).
 * This remounts its children each time the page is shown again, so they re-read saved data.
 */
export default function FreshOnShow({ children }: { children: React.ReactNode }) {
  const [shows, setShows] = useState(0);
  const mounted = useRef(false);
  // Hiding a page runs effect cleanups and showing it again re-runs the effects: re-read on re-show.
  useLayoutEffect(() => {
    if (mounted.current) setShows((n) => n + 1);
    mounted.current = true;
  }, []);
  return <Fragment key={shows}>{children}</Fragment>;
}
