"use client";

import { useEffect, type ReactNode } from "react";

/**
 * A modal panel that rises from the bottom on phones (centered on larger screens).
 *
 * The whole overlay scrolls, not the panel: a panel taller than the screen can always be scrolled
 * to its top. (A panel capped at 90vh doesn't work on iPhone Safari, where vh includes the space
 * behind the toolbars, so its top, with the close button, ended up off screen.) The page behind
 * is locked while it is open (on <html>: locking <body> would reset the page to its top), so
 * swipes move the panel and not the page.
 */
export default function Sheet({
  children,
  onClose,
  className = "",
  ...aria
}: {
  children: ReactNode;
  /** Tapping outside the panel or pressing Escape. Leave out for panels that must be completed. */
  onClose?: () => void;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  useEffect(() => {
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          {...aria}
          className={`w-full max-w-sm animate-rise rounded-[1.5rem] bg-paper p-6 text-ink shadow-2xl ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
