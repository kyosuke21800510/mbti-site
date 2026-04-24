"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  type MBTIType, type ZodiacType, type Category, type FortuneData,
  CATEGORY_LABELS, CATEGORY_EMOJIS, CATEGORY_COLORS, CATEGORIES,
  MBTI_TYPES, ZODIAC_TYPES, getISOWeekKey, getISOMonthKey,
} from "@/lib/types";

interface Props {
  mbti: string;
  zodiac: string;
  name: string;
  category: string;
}

function getFortuneFilePath(category: Category): string {
  const key = category === "monthly" ? getISOMonthKey() : getISOWeekKey();
  return `/fortunes/${key}.json`;
}

async function fetchFromJson(
  mbti: string,
  zodiac: string,
  category: Category,
): Promise<FortuneData> {
  const filePath = getFortuneFilePath(category);
  const res = await fetch(filePath, { cache: "force-cache" });
  if (!res.ok) throw new Error(`運勢データが見つかりません (${filePath})`);
  const json = await res.json() as Record<string, FortuneData>;
  const key = `${mbti}_${zodiac}`;
  const data = json[key];
  if (!data) throw new Error(`${key} のデータがありません`);
  return data;
}

function XShareButton({ mbti, zodiac, name, category, keyword, luckyNumber }: {
  mbti: string; zodiac: string; name: string; category: string;
  keyword: string; luckyNumber: number;
}) {
  const label = CATEGORY_LABELS[category as Category] ?? category;
  const text = `【MBTI占い】${name}（${mbti}×${zodiac}）の${label}\n✨ キーワード：「${keyword}」\n🍀 ラッキーナンバー：${luckyNumber}\n\n#MBTI占い #${mbti} #${zodiac}`;
  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=MBTI占い`;

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-black text-white font-black text-sm shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-150"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
      Xでシェアする
    </a>
  );
}

export default function FortuneClient({ mbti, zodiac, name, category }: Props) {
  const router = useRouter();
  const [fortune, setFortune] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const isValidMBTI = MBTI_TYPES.includes(mbti as MBTIType);
  const isValidZodiac = ZODIAC_TYPES.includes(zodiac as ZodiacType);
  const isValidCategory = CATEGORIES.includes(category as Category);

  const fetchFortune = useCallback(async () => {
    if (!isValidMBTI || !isValidZodiac || !isValidCategory) return;
    setLoading(true);
    setError(null);
    setVisible(false);

    try {
      const data = await fetchFromJson(mbti, zodiac, category as Category);
      setFortune(data);
    } catch {
      setError("星の声が届きませんでした。運勢データを準備中かもしれません。");
    } finally {
      setLoading(false);
      setTimeout(() => setVisible(true), 80);
    }
  }, [mbti, zodiac, category, isValidMBTI, isValidZodiac, isValidCategory]);

  useEffect(() => {
    fetchFortune();
  }, [fetchFortune]);

  if (!isValidMBTI || !isValidZodiac || !isValidCategory) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 gap-4">
        <p className="font-bold text-[#1a1a2e]/40">無効なパラメータです</p>
        <button
          onClick={() => router.push("/")}
          className="bg-[#3D5AFE] text-white font-black px-6 py-3 rounded-2xl shadow-[0_4px_14px_rgba(61,90,254,0.4)]"
        >
          トップに戻る
        </button>
      </main>
    );
  }

  const catColors = CATEGORY_COLORS[category as Category];
  const catLabel = CATEGORY_LABELS[category as Category];
  const catEmoji = CATEGORY_EMOJIS[category as Category];
  const otherCategories = CATEGORIES.filter((c) => c !== category);

  // カテゴリごとの薄い背景色
  const cardTint =
    category === "general" ? "bg-[#F0F3FF]" :
    category === "love"    ? "bg-[#FFF0F6]" :
                             "bg-[#FFFDE7]";

  const backUrl = `/select?mbti=${mbti}&zodiac=${encodeURIComponent(zodiac)}&name=${encodeURIComponent(name)}`;

  return (
    <main className="min-h-screen px-4 py-10 max-w-lg mx-auto">
      {/* Nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push(backUrl)}
          className="text-sm font-bold text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors flex items-center gap-1"
        >
          ← カテゴリ選択に戻る
        </button>
        <button
          onClick={() => router.push("/")}
          className="text-sm font-bold text-white bg-[#1a1a2e] px-4 py-2 rounded-full hover:bg-[#1a1a2e]/80 transition-colors"
        >
          🏠 トップへ
        </button>
      </div>

      {/* Identity */}
      <div
        style={{ backgroundColor: catColors.bg, color: catColors.text }}
        className="rounded-3xl p-6 mb-6 shadow-[0_6px_24px_var(--cat-shadow)]"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold opacity-70">{catEmoji} {catLabel}</span>
          <span className="text-sm font-bold opacity-70">{mbti} × {zodiac}</span>
        </div>
        <p className="text-2xl font-black">{name}の{catLabel}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full animate-bounce"
                style={{
                  backgroundColor: catColors.bg,
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>
          <p className="font-bold text-[#1a1a2e]/40 text-sm">星を読んでいます…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12 space-y-4">
          <p className="text-2xl">😢</p>
          <p className="font-bold text-[#1a1a2e]/50 text-sm">{error}</p>
          <button
            onClick={fetchFortune}
            style={{ backgroundColor: catColors.bg, color: catColors.text }}
            className="px-6 py-3 rounded-2xl font-black text-sm"
          >
            もう一度試す
          </button>
        </div>
      )}

      {/* Fortune */}
      {fortune && !loading && (
        <div
          className={`space-y-4 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Headline */}
          <div className={`${cardTint} rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.07)]`}>
            <p className="text-xl font-black leading-relaxed text-[#1a1a2e]">
              {fortune.headline}
            </p>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100">
            {category === "monthly" && (
              <span
                className="inline-block text-xs font-black px-3 py-1 rounded-full text-white mb-3"
                style={{ backgroundColor: catColors.bg }}
              >
                総評
              </span>
            )}
            <p className="text-sm font-bold leading-7 text-[#1a1a2e]/75">{fortune.summary}</p>
          </div>

          {/* Sections (monthly only) */}
          {category === "monthly" && (["人間関係", "恋愛"] as const).map((label, i) => {
            const section = fortune.sections[i];
            if (!section) return null;
            return (
              <div
                key={label}
                className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100"
              >
                <span
                  className="inline-block text-xs font-black px-3 py-1 rounded-full text-white mb-3"
                  style={{ backgroundColor: catColors.bg }}
                >
                  {label}
                </span>
                <p className="text-sm font-bold leading-7 text-[#1a1a2e]/75">{section.content}</p>
              </div>
            );
          })}

          {/* Lucky */}
          {category === "weekly" && <div className="grid grid-cols-3 gap-3">
            <div className={`${cardTint} rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.07)] text-center`}>
              <p className="text-[10px] font-black text-[#1a1a2e]/40 uppercase tracking-widest mb-1">Keyword</p>
              <p className="text-lg font-black">{fortune.keyword}</p>
            </div>
            <div className={`${cardTint} rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.07)] text-center`}>
              <p className="text-[10px] font-black text-[#1a1a2e]/40 uppercase tracking-widest mb-1">Lucky No.</p>
              <p className="text-2xl font-black" style={{ color: catColors.bg }}>{fortune.luckyNumber}</p>
            </div>
            <div className={`${cardTint} rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.07)] text-center`}>
              <p className="text-[10px] font-black text-[#1a1a2e]/40 uppercase tracking-widest mb-1">Color</p>
              <p className="text-base font-black">{fortune.luckyColor}</p>
            </div>
          </div>}

          {/* X Share */}
          <XShareButton
            mbti={mbti} zodiac={zodiac} name={name} category={category}
            keyword={fortune.keyword} luckyNumber={fortune.luckyNumber}
          />

          {/* Other categories */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100">
            <p className="text-xs font-black text-[#1a1a2e]/30 uppercase tracking-widest mb-4">
              他の占いも見る
            </p>
            <div className="space-y-2">
              {otherCategories.map((cat) => {
                const c = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() =>
                      router.push(
                        `/fortune?mbti=${mbti}&zodiac=${encodeURIComponent(zodiac)}&name=${encodeURIComponent(name)}&category=${cat}`
                      )
                    }
                    style={{ backgroundColor: c.bg, color: c.text }}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-black text-sm hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
                  >
                    <span>{CATEGORY_EMOJIS[cat]} {CATEGORY_LABELS[cat]}</span>
                    <span className="opacity-60">→</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AdSense placeholder */}
          <div
            id="adsense-result-bottom"
            className="w-full min-h-[100px] rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"
          >
            <p className="text-xs font-bold text-gray-300">広告スペース（AdSense）</p>
          </div>

          <div className="text-center pb-4">
            <button
              onClick={() => router.push("/")}
              className="text-xs font-bold text-[#1a1a2e]/30 hover:text-[#FF4D8B] underline underline-offset-2 transition-colors"
            >
              はじめからやり直す
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
