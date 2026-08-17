import { PIXEL_SIZE } from "./generate-candle-body";

type CandleTopDripsProps = {
  seed: string;
  lit?: boolean;
  extinguished?: boolean;
};

type TopDrip = {
  x: number;
  y: number;
  color: "wax" | "highlight" | "shadow" | "outline" | "castShadow";
};

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function generateTopDrips(seed: string, active: boolean): TopDrip[] {
  const hash = hashString(`${seed}:top-wax-tears`);
  const longDrop = active ? 5 + (hash % 2) : 3;
  const shoulder = hash % 3 === 0 ? 1 : 0;
  const tipLean = hash % 4 === 0 ? -1 : 0;
  const castShadow = [
    { x: 8, y: 1, color: "castShadow" },
    { x: 9, y: 2, color: "castShadow" },
    { x: 9, y: 3, color: "castShadow" },
    { x: 9 + Math.min(0, tipLean), y: 4, color: "castShadow" },
  ] satisfies TopDrip[];
  const maskedCastShadow = castShadow.filter((pixel) => pixel.x >= 2 && pixel.x <= 9 && pixel.y <= longDrop);
  const pixels: TopDrip[] = [
    { x: 2, y: 0, color: "outline" },
    { x: 3, y: 0, color: "highlight" },
    { x: 2, y: 1, color: "outline" },
    { x: 3, y: 1, color: "shadow" },
    { x: 5, y: 0, color: "highlight" },
    { x: 6, y: 0, color: "outline" },
    { x: 9, y: 0, color: "wax" },
    { x: 10, y: 0, color: "highlight" },
    { x: 11, y: 0, color: "outline" },
    { x: 9, y: 1, color: "wax" },
    { x: 10, y: 1, color: "wax" },
    { x: 11, y: 1, color: "outline" },
    { x: 10 + shoulder, y: 2, color: "wax" },
    { x: 11 + shoulder, y: 2, color: "outline" },
  ];

  for (let y = 3; y < longDrop; y += 1) {
    const isTip = y === longDrop - 1;
    const x = isTip ? 10 + tipLean : 10;

    pixels.push({ x, y, color: isTip ? "shadow" : "wax" });
    pixels.push({ x: x + 1, y, color: "outline" });

    if (!isTip && y % 2 === 1) {
      pixels.push({ x: x - 1, y, color: "highlight" });
    }
  }

  if (active) {
    pixels.push({ x: 9 + tipLean, y: longDrop, color: "outline" });
    pixels.push({ x: 10 + tipLean, y: longDrop, color: "shadow" });
    pixels.push({ x: 11 + tipLean, y: longDrop, color: "outline" });
  }

  return [...maskedCastShadow, ...pixels];
}

const colors: Record<TopDrip["color"], string> = {
  wax: "bg-[color:var(--wax)]",
  highlight: "bg-[#fff8df]",
  shadow: "bg-[color:var(--wax-shadow)]",
  outline: "bg-[#b8954f]",
  castShadow: "bg-[#d5b66e]",
};

export function CandleTopDrips({ seed, lit = true, extinguished = false }: CandleTopDripsProps) {
  const drips = generateTopDrips(seed, lit && !extinguished);

  return (
    <div
      className="pointer-events-none absolute -left-1 top-0 z-10 h-8 w-16"
      aria-hidden="true"
    >
      {drips.map((drip) => (
        <span
          key={`${drip.x}-${drip.y}-${drip.color}`}
          className={`absolute block ${colors[drip.color]}`}
          style={{
            left: drip.x * PIXEL_SIZE,
            top: drip.y * PIXEL_SIZE,
            width: PIXEL_SIZE,
            height: PIXEL_SIZE,
          }}
        />
      ))}
    </div>
  );
}
