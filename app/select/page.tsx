"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CATEGORY_LABELS, CATEGORY_EMOJIS, CATEGORY_COLORS, CATEGORIES, type Category } from "@/lib/types";

function SelectPage() {
  const router = useRouter();
  const params = useSearchParams();
  const mbti = params.get("mbti") ?? "";
  const zodiac = params.get("zodiac") ?? "";
  const name = params.get("name") ?? "";

  if (!mbti || !zodiac || !name) {
    router.replace("/");
    return null;
  }

  const go = (category: Category) => {
    router.push(
      `/fortune?mbti=${mbti}&zodiac=${encodeURIComponent(zodiac)}&name=${encodeURIComponent(name)}&category=${category}`
    );
  };

  return (
    <main className="min-h-screen px-4 py-12 max-w-lg mx-auto">
      {/* Back */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm font-bold text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors flex items-center gap-1"
        >
          ← 戻る
        </button>
        <button
          onClick={() => router.push("/")}
          className="text-sm font-bold text-white bg-[#1a1a2e] px-4 py-2 rounded-full hover:bg-[#1a1a2e]/80 transition-colors"
        >
          🏠 トップへ
        </button>
      </div>

      {/* Identity badge */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-full font-black text-sm shadow-[0_4px_16px_rgba(26,26,46,0.3)] mb-6">
          <span className="text-[#FFD600]">{name}</span>
          <span className="text-[#3D5AFE]">{mbti}</span>
          <span className="text-[#FF4D8B]">{zodiac}</span>
        </div>
        <h2 className="text-2xl font-black">何を占いますか？</h2>
      </div>

      {/* Category cards */}
      <div className="space-y-4">
        {CATEGORIES.map((category) => {
          const colors = CATEGORY_COLORS[category];
          return (
            <button
              key={category}
              onClick={() => go(category)}
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                boxShadow: `0 6px 24px ${colors.shadow}`,
              }}
              className="w-full rounded-3xl p-6 flex items-center justify-between font-black text-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-150 cursor-pointer"
            >
              <span className="flex items-center gap-4">
                <span className="text-3xl">{CATEGORY_EMOJIS[category]}</span>
                <span>{CATEGORY_LABELS[category]}</span>
              </span>
              <span className="text-2xl opacity-60">→</span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={() => router.push("/")}
          className="text-xs font-bold text-[#1a1a2e]/30 hover:text-[#FF4D8B] underline underline-offset-2 transition-colors"
        >
          はじめからやり直す
        </button>
      </div>
    </main>
  );
}

export default function SelectPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-black text-[#1a1a2e]/30">読み込み中…</p>
      </main>
    }>
      <SelectPage />
    </Suspense>
  );
}
