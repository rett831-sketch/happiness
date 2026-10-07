import Branch from "./Branch";
import Seal from "./Seal";

/**
 * Poster-style header: a bamboo blind, one large brush character, a vertical
 * four-character couplet with a seal, and a branch hanging at the top right.
 *
 * The text block keeps a right padding (pr-16) so the branch's leaves never
 * cover it, even on a 360px-wide phone.
 */
export default function PosterHeader({
  glyph,
  label,
  couplet,
  seal,
  night = false,
  className = "",
}: {
  glyph: string;
  label: string;
  couplet: [string, string];
  seal: string;
  night?: boolean;
  className?: string;
}) {
  return (
    <header className={`relative mx-auto h-[18rem] max-w-sm animate-rise ${className}`}>
      <div
        className={`absolute inset-y-0 left-2 right-8 rounded-[2px] bamboo-blind ${night ? "opacity-[0.07]" : "opacity-90"}`}
      />
      <Branch night={night} className="absolute -right-5 -top-6 h-60 w-28" />
      {night && (
        // the moon, in the empty space under the couplet: it scrolls with the header, so it never covers text
        <div
          aria-hidden
          className="absolute bottom-10 left-[52%] size-11 animate-fade rounded-full bg-moon shadow-[0_0_80px_26px_rgba(232,234,217,0.14)]"
        />
      )}

      <div className="relative flex items-start gap-4 pl-6 pr-16 pt-10">
        <div className="flex shrink-0 flex-col items-center">
          <h1 className="font-brush text-[6.25rem] leading-none" aria-label={label}>
            {glyph}
          </h1>
          <p className={`mt-3 pl-[0.5em] text-sm tracking-[0.5em] ${night ? "text-moon/60" : "text-ink-soft"}`}>
            {label}
          </p>
        </div>
        <div className="flex shrink-0 items-end gap-2 pt-1">
          <p
            className={`text-base font-light leading-[1.9] tracking-[0.3em] [writing-mode:vertical-rl] ${
              night ? "text-moon/85" : "text-ink"
            }`}
          >
            {couplet[0]}
            <br />
            {couplet[1]}
          </p>
          <Seal text={seal} className="mb-1" />
        </div>
      </div>
    </header>
  );
}
