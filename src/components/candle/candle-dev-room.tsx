"use client";

import { useEffect, useMemo, useState } from "react";
import type { CandleType } from "@/types/database";
import { CANDLE_BODY_CONFIGS, CANDLE_LABELS, getVisibleWaxRows } from "@/lib/candle/config";
import { generateCandleBody, PIXEL_SIZE } from "./generate-candle-body";
import { PixelCandle } from "./pixel-candle";

const candleTypes = Object.keys(CANDLE_LABELS) as CandleType[];
const speeds = [0.25, 0.5, 1, 2, 5, 10, 25, 50];

function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-8 border-b border-[rgba(39,32,25,0.12)] py-2">
      <span className="text-[color:var(--muted)]">{label}</span>
      <span className="text-right text-[color:var(--foreground)]">{value}</span>
    </div>
  );
}

export function CandleDevRoom() {
  const [candleType, setCandleType] = useState<CandleType>("medium");
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [playing, setPlaying] = useState(false);
  const [lit, setLit] = useState(true);
  const [seed, setSeed] = useState("dev-candle");

  const config = CANDLE_BODY_CONFIGS[candleType];
  const visibleRows = getVisibleWaxRows(progress, candleType);
  const body = useMemo(
    () => generateCandleBody({ seed, rows: visibleRows, candleType }),
    [candleType, seed, visibleRows],
  );
  const pixelCount = body.rows.reduce((total, row) => total + row.pixels.length, 0);
  const dripCount = body.rows.reduce(
    (total, row) => total + row.pixels.filter((pixel) => pixel.type === "drip").length,
    0,
  );
  const extinguished = progress >= 1;
  const state = extinguished ? "extinguished" : playing ? "burning" : lit ? "paused" : "unlit";

  useEffect(() => {
    if (!playing) {
      return;
    }

    let previous = performance.now();
    let frame = 0;

    function tick(now: number) {
      const elapsed = now - previous;
      previous = now;
      setProgress((current) => {
        const next = Math.min(1, current + (elapsed / 1000) * (speed / 100));
        if (next >= 1) {
          setPlaying(false);
        }
        return next >= 1 ? 1 : next;
      });
      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, speed]);

  function reset() {
    setPlaying(false);
    setProgress(0);
    setLit(true);
  }

  return (
    <main className="min-h-dvh px-5 py-5 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(280px,1fr)_360px]">
        <section className="flex min-h-[calc(100dvh-2.5rem)] flex-col items-center justify-center gap-8">
          <div className="flex min-h-[360px] items-end justify-center">
            <PixelCandle
              progress={progress}
              candleType={candleType}
              seed={seed || "dev-candle"}
              lit={lit}
              extinguished={extinguished}
              size="room"
            />
          </div>

          <div className="pixel-text flex flex-wrap items-center justify-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setPlaying((current) => !current)}
              disabled={extinguished}
              className="border border-[rgba(39,32,25,0.22)] px-3 py-2 transition hover:border-[color:var(--ember)] disabled:opacity-40"
            >
              {playing ? "pause" : "play"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="border border-[rgba(39,32,25,0.22)] px-3 py-2 transition hover:border-[color:var(--ember)]"
            >
              reset
            </button>
            <button
              type="button"
              onClick={() => setProgress(1)}
              className="border border-[rgba(39,32,25,0.22)] px-3 py-2 transition hover:border-[color:var(--ember)]"
            >
              burn out
            </button>
          </div>
        </section>

        <aside className="pixel-text flex flex-col gap-6 text-sm">
          <section className="border border-[rgba(39,32,25,0.18)] bg-[rgba(255,248,233,0.72)] p-4">
            <h1 className="mb-5 text-base text-[color:var(--foreground)]">candle dev</h1>

            <div className="mb-5 flex gap-2" role="radiogroup" aria-label="Candle type">
              {candleTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCandleType(type)}
                  className={`flex-1 border px-2 py-2 transition ${
                    candleType === type
                      ? "border-[color:var(--foreground)] text-[color:var(--foreground)]"
                      : "border-[rgba(39,32,25,0.18)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                  }`}
                  role="radio"
                  aria-checked={candleType === type}
                >
                  {type}
                </button>
              ))}
            </div>

            <label className="mb-5 block">
              <span className="mb-2 flex justify-between">
                <span className="text-[color:var(--muted)]">progress</span>
                <span>{formatPercent(progress)}</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
                className="w-full accent-[color:var(--ember)]"
              />
            </label>

            <label className="mb-5 block">
              <span className="mb-2 flex justify-between">
                <span className="text-[color:var(--muted)]">speed</span>
                <span>{speed}x</span>
              </span>
              <input
                type="range"
                min="0.25"
                max="50"
                step="0.25"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="w-full accent-[color:var(--ember)]"
              />
              <div className="mt-3 grid grid-cols-4 gap-2">
                {speeds.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSpeed(value)}
                    className="border border-[rgba(39,32,25,0.18)] px-2 py-1 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
                  >
                    {value}x
                  </button>
                ))}
              </div>
            </label>

            <label className="mb-5 block">
              <span className="mb-2 block text-[color:var(--muted)]">seed</span>
              <input
                type="text"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                className="w-full border border-[rgba(39,32,25,0.18)] bg-transparent px-3 py-2 outline-none focus:border-[color:var(--ember)]"
              />
            </label>

            <label className="flex items-center justify-between gap-4">
              <span className="text-[color:var(--muted)]">flame lit</span>
              <input
                type="checkbox"
                checked={lit}
                onChange={(event) => setLit(event.target.checked)}
                className="size-4 accent-[color:var(--ember)]"
              />
            </label>
          </section>

          <section className="border border-[rgba(39,32,25,0.18)] bg-[rgba(255,248,233,0.72)] p-4">
            <h2 className="mb-3 text-base">status</h2>
            <Stat label="state" value={state} />
            <Stat label="type" value={candleType} />
            <Stat label="progress" value={formatPercent(progress)} />
            <Stat label="visible rows" value={`${visibleRows} / ${config.maxRows}`} />
            <Stat label="middle height" value={`${visibleRows * PIXEL_SIZE}px`} />
            <Stat label="pixel size" value={`${PIXEL_SIZE}px`} />
            <Stat label="body width" value={`${config.width * PIXEL_SIZE}px`} />
            <Stat label="min rows" value={config.minRows} />
            <Stat label="dom pixels" value={pixelCount} />
            <Stat label="drip pixels" value={dripCount} />
          </section>
        </aside>
      </div>
    </main>
  );
}
