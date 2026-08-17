"use client";

import type { CandleType } from "@/types/database";
import { CANDLE_LABELS } from "@/lib/candle/config";

type CandleSelectorProps = {
  value: CandleType;
  onChange: (value: CandleType) => void;
  onLight: () => void;
};

const types = Object.keys(CANDLE_LABELS) as CandleType[];

export function CandleSelector({ value, onChange, onLight }: CandleSelectorProps) {
  return (
    <div className="pixel-text flex flex-col items-center gap-8 text-center">
      <div className="flex items-center gap-4" role="radiogroup" aria-label="Choose candle size">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`px-2 py-1 text-sm transition ${
              value === type
                ? "text-[color:var(--foreground)] underline underline-offset-8"
                : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            }`}
            role="radio"
            aria-checked={value === type}
          >
            {CANDLE_LABELS[type]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onLight}
        className="inline-flex flex-col items-center gap-1 text-sm text-[color:var(--foreground)] transition hover:text-[color:var(--ember)]"
      >
        <span>light this candle</span>
        <span aria-hidden="true">↓</span>
      </button>
    </div>
  );
}
