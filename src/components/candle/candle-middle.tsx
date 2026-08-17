import { useMemo } from "react";
import type { CandleType } from "@/types/database";
import { generateCandleBody, PIXEL_SIZE, type CandlePixelType } from "./generate-candle-body";

type CandleMiddleProps = {
  rows: number;
  candleType: CandleType;
  seed: string;
};

const pixelClasses: Record<CandlePixelType, string> = {
  wax: "bg-[color:var(--wax)]",
  highlight: "bg-[#f4dfa8]",
  shadow: "bg-[color:var(--wax-shadow)]",
  drip: "bg-[#d8ba6f]",
};

export function CandleMiddle({ rows, candleType, seed }: CandleMiddleProps) {
  const body = useMemo(() => generateCandleBody({ seed, rows, candleType }), [candleType, rows, seed]);
  const lightingRows = body.rows.map((row) => ({
    y: row.y,
    left: row.offset,
    right: row.offset + row.width - 1,
    innerRight: row.offset + row.width - 2,
  }));

  return (
    <div
      className="relative"
      style={{
        width: body.width * PIXEL_SIZE,
        height: body.rows.length * PIXEL_SIZE,
      }}
      aria-hidden="true"
    >
      {body.rows.flatMap((row) =>
        row.pixels.map((pixel) => (
          <span
            key={`${pixel.y}-${pixel.x}-${pixel.type}`}
            className={`absolute block ${pixelClasses[pixel.type]}`}
            style={{
              left: pixel.x * PIXEL_SIZE,
              top: pixel.y * PIXEL_SIZE,
              width: PIXEL_SIZE,
              height: PIXEL_SIZE,
            }}
          />
        )),
      )}
      {lightingRows.flatMap((row) => [
        <span
          key={`${row.y}-body-highlight`}
          className="absolute block"
          style={{
            left: row.left * PIXEL_SIZE,
            top: row.y * PIXEL_SIZE,
            width: PIXEL_SIZE,
            height: PIXEL_SIZE,
            background: "rgba(255, 248, 223, 0.48)",
          }}
        />,
        <span
          key={`${row.y}-body-soft-shadow`}
          className="absolute block"
          style={{
            left: row.innerRight * PIXEL_SIZE,
            top: row.y * PIXEL_SIZE,
            width: PIXEL_SIZE,
            height: PIXEL_SIZE,
            background: "rgba(210, 176, 103, 0.28)",
          }}
        />,
        <span
          key={`${row.y}-body-edge-shadow`}
          className="absolute block"
          style={{
            left: row.right * PIXEL_SIZE,
            top: row.y * PIXEL_SIZE,
            width: PIXEL_SIZE,
            height: PIXEL_SIZE,
            background: "rgba(156, 118, 55, 0.34)",
          }}
        />,
      ])}
    </div>
  );
}
