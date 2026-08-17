"use client";

import { useActiveCandles } from "@/components/realtime/use-active-candles";

export function ActiveStudyCount() {
  const { count, isConnected } = useActiveCandles();

  if (count === null) {
    return (
      <p className="pixel-text text-xs text-[color:var(--muted)]">
        waiting for candles
      </p>
    );
  }

  return (
    <p
      className="pixel-text text-xs text-[color:var(--muted)]"
      aria-live="polite"
      title={isConnected ? "Realtime presence connected" : "Connecting"}
    >
      <span aria-hidden="true" className="mr-2 text-[color:var(--ember)]">
        ●
      </span>
      {count} {count === 1 ? "candle is" : "candles are"} burning right now
    </p>
  );
}
