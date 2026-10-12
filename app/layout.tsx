import type { Metadata } from "next";
import { Alegreya, Alegreya_Sans } from "next/font/google";
import "./globals.css";
import ClickSound from "@/components/ClickSound";

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
      </body>
    </html>
  );
}