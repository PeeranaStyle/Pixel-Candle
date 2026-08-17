"use client";

import { motion } from "framer-motion";
import type { CandleType } from "@/types/database";
import { getVisibleWaxRows } from "@/lib/candle/config";
import { CandleBottom } from "./candle-bottom";
import { CandleFlame } from "./candle-flame";
import { CandleFoot } from "./candle-foot";
import { CandleMiddle } from "./candle-middle";
import { CandleTop } from "./candle-top";
import { CandleTopDrips } from "./candle-top-drips";
import { CandleWick } from "./candle-wick";

type PixelCandleProps = {
  progress?: number;
  candleType?: CandleType;
  seed?: string;
  lit?: boolean;
  extinguished?: boolean;
  lighting?: boolean;
  size?: "hero" | "room";
};

export function PixelCandle({
  progress = 0,
  candleType = "medium",
  seed = "landing-candle",
  lit = true,
  extinguished = false,
  lighting = false,
  size = "hero",
}: PixelCandleProps) {
  const visibleRows = getVisibleWaxRows(progress, candleType);

  return (
    <motion.div
      className={`pixelated flex origin-bottom flex-col items-center ${size === "room" ? "scale-110 sm:scale-125" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ opacity: { duration: 0.8 }, y: { duration: 0.8, ease: "easeOut" } }}
      role="img"
      aria-label={extinguished ? "An extinguished pixel candle" : "A lit pixel candle"}
    >
      <CandleFlame lit={lit} extinguished={extinguished} lighting={lighting} />
      <CandleWick />
      <div className="relative">
        <CandleTop />
        <CandleTopDrips seed={seed} lit={lit} extinguished={extinguished} />
      </div>
      <CandleMiddle rows={visibleRows} candleType={candleType} seed={seed} />
      <CandleBottom />
      <CandleFoot />
    </motion.div>
  );
}
