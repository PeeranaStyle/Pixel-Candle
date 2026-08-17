"use client";

import { useEffect, useState } from "react";
import { CandleArt } from "./candle-art";

type CandleFlameProps = {
  lit?: boolean;
  extinguished?: boolean;
  lighting?: boolean;
};

const frames = [
  "/pixel-candle/flame/frame-01.png",
  "/pixel-candle/flame/frame-02.png",
  "/pixel-candle/flame/frame-03.png",
  "/pixel-candle/flame/frame-04.png",
];

export function CandleFlame({ lit = true, extinguished = false, lighting = false }: CandleFlameProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!lit || extinguished) {
      return;
    }

    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % frames.length);
    }, 420);

    return () => window.clearInterval(timer);
  }, [extinguished, lit]);

  if (!lit || extinguished) {
    return <div className="h-12" aria-hidden="true" />;
  }

  return (
    <div className="relative -mb-1 flex h-10 w-14 items-end justify-center" aria-hidden="true">
      <span className="candle-smoke candle-smoke-a" />
      <span className="candle-smoke candle-smoke-b" />
      <span className="candle-smoke candle-smoke-c" />
      <CandleArt src={frames[frame]} width={24} height={24} className={lighting ? "candle-flame-appear" : ""} />
    </div>
  );
}
