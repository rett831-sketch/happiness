/**
 * The night moon. With `fox`, a sitting fox's silhouette shows on it (the 月亮上的狐狸 easter egg),
 * the way some people see a rabbit on the moon.
 */
export default function Moon({ fox = false, className = "" }: { fox?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#e8ead9" />
      <g fill="#b5b398" className={`transition-opacity duration-1000 ${fox ? "opacity-100" : "opacity-0"}`}>
        {/* tail, curled up beside the body */}
        <path d="M24 31 C34 32 36 21 30 17 C31 24 28 27.5 23 27 Z" />
        {/* body */}
        <ellipse cx="19" cy="26.5" rx="6.5" ry="7" />
        {/* head with two pointed ears, muzzle down */}
        <path d="M12 14 L14.8 6.5 L17.6 11.6 L20.4 11.6 L23.2 6.5 L26 14 L19 19.5 Z" />
      </g>
    </svg>
  );
}
