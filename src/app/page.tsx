import { ActiveStudyCount } from "@/components/landing/active-study-count";
import { LightCandleButton } from "@/components/landing/light-candle-button";
import { PixelCandle } from "@/components/candle/pixel-candle";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-5 sm:px-10 sm:py-7">
      <section className="flex flex-1 flex-col items-center justify-center gap-9 pb-10 pt-14 text-center sm:gap-10">
        <PixelCandle progress={0.04} candleType="medium" seed="landing-candle" />
        <LightCandleButton />
      </section>

      <footer className="flex min-h-44 flex-col items-center justify-end gap-8 pb-8 text-center">
        <p className="pixel-text text-sm leading-7 text-[color:var(--muted)]">
          no timer. no distractions.
          <br />
          just you and the flame.
        </p>
        <ActiveStudyCount />
      </footer>
    </main>
  );
}
