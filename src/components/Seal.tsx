/** A small vermilion seal (印章) with characters written top to bottom. */
export default function Seal({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block -rotate-2 rounded-[2px] bg-seal/90 px-[3px] py-1 text-[10px] leading-[1.15] text-[#f7efe2] [writing-mode:vertical-rl] ${className}`}
    >
      {text}
    </span>
  );
}
