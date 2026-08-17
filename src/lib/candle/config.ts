import type { CandleType } from "@/types/database";

export const CANDLE_DURATIONS: Record<CandleType, number> = {
  small: 25 * 60 * 1000,
  medium: 50 * 60 * 1000,
  large: 90 * 60 * 1000,
};

export const CANDLE_LABELS: Record<CandleType, string> = {
  small: "small",
  medium: "medium",
  large: "large",
};

export const CANDLE_BODY_CONFIGS: Record<CandleType, { maxRows: number; minRows: number; width: number }> = {
  small: { maxRows: 14, minRows: 2, width: 8 },
  medium: { maxRows: 30, minRows: 2, width: 8 },
  large: { maxRows: 52, minRows: 2, width: 8 },
};

export function getCandleProgress(startedAt: number, duration: number, now = Date.now()) {
  return Math.min(1, Math.max(0, (now - startedAt) / duration));
}

export function getVisibleWaxRows(progress: number, candleType: CandleType = "medium") {
  const config = CANDLE_BODY_CONFIGS[candleType];
  return Math.round(config.maxRows - (config.maxRows - config.minRows) * progress);
}

export function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
