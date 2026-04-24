import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
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
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9901234187528885"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        {children}
        <footer className="py-8 text-center text-xs text-[#1a1a2e]/30 font-bold space-x-4">
          <Link href="/privacy" className="hover:text-[#1a1a2e]/60 transition-colors">
            プライバシーポリシー
          </Link>
          <Link href="/contact" className="hover:text-[#1a1a2e]/60 transition-colors">
            お問い合わせ
          </Link>
        </footer>
      </body>
    </html>
  );
}
