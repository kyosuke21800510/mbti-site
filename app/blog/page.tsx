import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/lib/blog";

export const metadata: Metadata = {
  title: "コラム | ORACLE",
  description: "MBTIと星座占いにまつわるコラム記事。占いの考え方や、MBTIと星座の関係について。",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-lg mx-auto bg-gradient-to-b from-white via-[#f8f6ff] to-white">
      <div className="text-center mb-10">
        <div className="inline-block mb-4">
          <span className="text-4xl">📝</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-[#3D5AFE] via-[#FF4D8B] to-[#FFD600] bg-clip-text text-transparent">
          コラム
        </h1>
        <p className="text-base font-bold text-[#1a1a2e]/50">
          MBTIと星座占いについて ✨
        </p>
      </div>

      <div className="space-y-4">
        {ARTICLES.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="block bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_6px_32px_rgba(61,90,254,0.15)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <h2 className="text-base font-black text-[#1a1a2e] mb-2 leading-snug">
              {article.title}
            </h2>
            <p className="text-sm font-bold text-[#1a1a2e]/50 leading-relaxed">
              {article.description}
            </p>
            <span className="mt-4 inline-block text-xs font-black text-[#3D5AFE]">
              続きを読む →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="text-sm font-bold text-[#1a1a2e]/30 hover:text-[#1a1a2e]/60 transition-colors"
        >
          ← トップへ戻る
        </Link>
      </div>
    </main>
  );
}
