import Link from "next/link";

export function LightCandleButton() {
  return (
    <Link
      href="/candle"
      className="pixel-text group inline-flex flex-col items-center gap-1 text-sm text-[color:var(--foreground)] transition hover:text-[color:var(--ember)]"
    >
      <span>light a candle</span>
      <span className="transition group-hover:translate-y-0.5" aria-hidden="true">
        ↓
      </span>
    </Link>
  );
}
