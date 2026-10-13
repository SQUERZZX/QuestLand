import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Alegreya, Alegreya_Sans } from "next/font/google";
import "./globals.css";
import "./assistant.css";
import "./landscape.css";
import "./polish.css";
import ClickSound from "@/components/ClickSound";
import Assistant from "@/components/Assistant";

const display = Alegreya({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["500", "700", "800"],
});

const body = Alegreya_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

export const viewport: Viewport = {
  themeColor: "#0b1020",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "QuestLands",
  description:
    "Учись через приключение: квесты каждый день, жизни, ранги и карта земель.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body>
        <ClickSound />
        {children}
        <Suspense fallback={null}>
          <Assistant />
        </Suspense>
      </body>
    </html>
  );
}