import { CandleArt } from "./candle-art";

export function CandleFoot() {
  return (
    <div className="-mt-px" aria-hidden="true">
      <CandleArt src="/pixel-candle/shadow.png" width={64} height={8} />
    </div>
  );
}
