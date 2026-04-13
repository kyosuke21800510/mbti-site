import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const rounded = M_PLUS_Rounded_1c({
  variable: "--font-rounded",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ORACLE — MBTI × 血液型占い",
  description: "あなたのMBTIと血液型から、今週の運勢・恋愛運・総合運を占います。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={rounded.variable}>
      <body className="min-h-screen bg-white text-[#1a1a2e] font-[family-name:var(--font-rounded)]">
        {children}
      </body>
    </html>
  );
}
