import type { Metadata } from "next";
import { Pixelify_Sans } from "next/font/google";
import { SoundProvider } from "@/components/ui/sound-provider";
import { SoundToggle } from "@/components/ui/sound-toggle";
import "./globals.css";

const pixelFont = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pixel Candle",
  description: "A quiet digital space for starting a study session.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixelFont.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <SoundProvider>
          <div className="pointer-events-none fixed left-6 top-5 z-50 sm:left-10 sm:top-7">
            <p className="pixel-text text-xs font-medium uppercase tracking-normal text-[color:var(--foreground)]">
              PIXEL CANDLE
            </p>
          </div>
          <div className="fixed right-6 top-5 z-50 sm:right-10 sm:top-7">
            <SoundToggle />
          </div>
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}
