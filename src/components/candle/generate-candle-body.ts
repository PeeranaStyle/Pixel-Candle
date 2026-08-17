import type { CandleType } from "@/types/database";
import { CANDLE_BODY_CONFIGS } from "@/lib/candle/config";

export const PIXEL_SIZE = 4;

export type CandlePixelType = "wax" | "highlight" | "shadow" | "drip";

export type CandlePixel = {
  x: number;
  y: number;
  type: CandlePixelType;
};

export type CandleRow = {
  y: number;
  width: number;
  offset: number;
  pixels: CandlePixel[];
};

export type CandleBody = {
  rows: CandleRow[];
  width: number;
  pixelSize: number;
};

type GenerateCandleBodyOptions = {
  seed: string;
  rows: number;
  candleType: CandleType;
};

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededValue(seed: string, index: number) {
  const hash = hashString(`${seed}:${index}`);
  return (hash % 1000) / 1000;
}

function rowWidth(baseWidth: number, seed: string, row: number) {
  const edgeTuck = row % 28 === 13 && seededValue(seed, Math.floor(row / 10)) > 0.82 ? -1 : 0;

  return baseWidth + edgeTuck;
}

function rowOffset(baseWidth: number, width: number, seed: string, row: number) {
  const centerOffset = Math.floor((baseWidth - width) / 2);
  const handDrawnOffset = width < baseWidth && seededValue(seed, row + 101) > 0.5 ? 1 : 0;

  return centerOffset + handDrawnOffset;
}

function pixelType(seed: string, row: number, column: number, width: number): CandlePixelType {
  const value = seededValue(seed, row * 31 + column * 17);
  const edge = column === 0 || column === width - 1;

  if (edge && value > 0.82) {
    return "shadow";
  }

  if (column === 1 && row % 8 === 1) {
    return "highlight";
  }

  if (column >= width - 2 && (row + column) % 13 === 0) {
    return "shadow";
  }

  return "wax";
}

function dripPixels(seed: string, row: number, baseWidth: number): CandlePixel[] {
  const drips = [
    { every: 48, start: hashString(`${seed}:left-drip`) % 19, x: 1, width: 1, length: 1 },
    { every: 64, start: hashString(`${seed}:right-drip`) % 23, x: baseWidth - 2, width: 1, length: 1 },
  ];

  return drips.flatMap((drip) => {
    const phase = (row - drip.start + drip.every) % drip.every;

    if (phase >= drip.length) {
      return [];
    }

    return Array.from({ length: drip.width }, (_, index) => ({
      x: drip.x + index,
      y: row,
      type: "drip" as const,
    }));
  });
}

export function generateCandleBody({ seed, rows, candleType }: GenerateCandleBodyOptions): CandleBody {
  const config = CANDLE_BODY_CONFIGS[candleType];
  const clampedRows = Math.max(0, Math.min(config.maxRows, rows));
  const skippedRows = config.maxRows - clampedRows;

  return {
    width: config.width,
    pixelSize: PIXEL_SIZE,
    rows: Array.from({ length: clampedRows }, (_, visibleIndex) => {
      const sourceRow = skippedRows + visibleIndex;
      const width = rowWidth(config.width, seed, sourceRow);
      const offset = rowOffset(config.width, width, seed, sourceRow);
      const bodyPixels = Array.from({ length: width }, (_, column) => ({
        x: offset + column,
        y: visibleIndex,
        type: pixelType(seed, sourceRow, column, width),
      }));

      return {
        y: visibleIndex,
        width,
        offset,
        pixels: [...bodyPixels, ...dripPixels(seed, sourceRow, config.width)],
      };
    }),
  };
}
