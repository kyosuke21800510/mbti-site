import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, getArticle } from "@/lib/blog";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} | ORACLE`,
    description: article.description,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen px-4 py-12 max-w-lg mx-auto bg-gradient-to-b from-white via-[#f8f6ff] to-white">
      <div className="mb-8">
        <Link
          href="/blog"
          className="text-sm font-bold text-[#1a1a2e]/40 hover:text-[#1a1a2e]/70 transition-colors"
        >
          ← コラム一覧
        </Link>
      </div>

      <article className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100">
        <h1 className="text-xl font-black text-[#1a1a2e] leading-snug mb-8 pb-6 border-b border-gray-100">
          {article.title}
        </h1>
        <div className="space-y-6">
          {article.paragraphs.map((p, i) => (
            <p key={i} className="text-base font-bold text-[#1a1a2e]/75 leading-[1.9]">
              {p}
            </p>
          ))}
        </div>
      </article>

      <div className="mt-10 space-y-4 text-center">
        <div>
          <Link
            href="/blog"
            className="text-sm font-bold text-[#3D5AFE] hover:text-[#3D5AFE]/70 transition-colors"
          >
            ← コラム一覧に戻る
          </Link>
        </div>
        <div>
          <Link
            href="/"
            className="text-sm font-bold text-[#1a1a2e]/30 hover:text-[#1a1a2e]/60 transition-colors"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
