import type { Metadata } from "next";
import { Suspense } from "react";
import FortuneClient from "./FortuneClient";
import { CATEGORY_LABELS, type Category } from "@/lib/types";

type SearchParams = Promise<{ mbti?: string; zodiac?: string; name?: string; category?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const p = await searchParams;
  const mbti = p.mbti ?? "";
  const zodiac = decodeURIComponent(p.zodiac ?? "");
  const name = decodeURIComponent(p.name ?? "");
  const category = p.category as Category | undefined;
  const catLabel = category ? (CATEGORY_LABELS[category] ?? "運勢") : "運勢";

  const title = name
    ? `${name}（${mbti}×${zodiac}）の${catLabel} | ORACLE占い`
    : `ORACLE — MBTI × 星座占い`;
  const description = `${mbti}×${zodiac}の${catLabel}を占いました。キーワードや運勢の詳細をチェック！`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ja_JP",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function FortunePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const p = await searchParams;
  const mbti = p.mbti ?? "";
  const zodiac = decodeURIComponent(p.zodiac ?? "");
  const name = decodeURIComponent(p.name ?? "");
  const category = p.category ?? "";

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="font-black text-[#1a1a2e]/30">読み込み中…</p>
        </main>
      }
    >
      <FortuneClient mbti={mbti} zodiac={zodiac} name={name} category={category} />
    </Suspense>
  );
}
