import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "お問い合わせ | MBTI星座占い",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-black mb-4 text-[#1a1a2e]">お問い合わせ</h1>
      <p className="text-sm text-[#1a1a2e]/60 mb-10 leading-relaxed">
        ご意見・ご要望・不具合報告などは、以下のフォームからお気軽にお送りください。
      </p>

      <a
        href="https://forms.gle/24NMsLXfGaQ5v2XP9"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-4 rounded-2xl text-center text-base font-black bg-[#1a1a2e] text-white shadow-[0_4px_16px_rgba(26,26,46,0.2)] hover:shadow-[0_6px_24px_rgba(26,26,46,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
      >
        お問い合わせフォームを開く
      </a>

      <div className="mt-10">
        <Link href="/" className="text-sm font-bold text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors">
          ← トップへ戻る
        </Link>
      </div>
    </main>
  );
}
