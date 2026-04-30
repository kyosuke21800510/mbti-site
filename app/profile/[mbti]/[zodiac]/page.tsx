import fs from "fs";
import path from "path";
import Link from "next/link";
import type { Metadata } from "next";
import { MBTI_TYPES, ZODIAC_SLUGS, SLUG_TO_ZODIAC, type ZodiacSlug } from "@/lib/types";

interface ProfileData {
  catchcopy: string;
  description: string;
}

const VALID_SLUGS = Object.values(ZODIAC_SLUGS) as ZodiacSlug[];

function loadProfile(mbti: string, zodiacJa: string): ProfileData | null {
  try {
    const filePath = path.join(process.cwd(), "public", "profiles", "profiles.json");
    const all = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, ProfileData>;
    return all[`${mbti}_${zodiacJa}`] ?? null;
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return MBTI_TYPES.flatMap((mbti) =>
    VALID_SLUGS.map((zodiac) => ({ mbti, zodiac }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mbti: string; zodiac: string }>;
}): Promise<Metadata> {
  const { mbti, zodiac: slug } = await params;
  const zodiacJa = SLUG_TO_ZODIAC[slug as ZodiacSlug];
  const profile = zodiacJa ? loadProfile(mbti, zodiacJa) : null;
  const title = profile
    ? `${profile.catchcopy}｜${mbti}×${zodiacJa}の特徴 | ORACLE`
    : `${mbti}の特徴 | ORACLE`;
  const description = profile
    ? profile.description.slice(0, 100) + "…"
    : `${mbti}の特徴を解説します。`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "ja_JP" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ mbti: string; zodiac: string }>;
}) {
  const { mbti, zodiac: slug } = await params;
  const zodiacJa = SLUG_TO_ZODIAC[slug as ZodiacSlug];

  const isValid =
    (MBTI_TYPES as readonly string[]).includes(mbti) &&
    zodiacJa !== undefined;

  if (!isValid) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 gap-4">
        <p className="font-bold text-[#1a1a2e]/40">無効なパラメータです</p>
        <Link
          href="/"
          className="bg-[#3D5AFE] text-white font-black px-6 py-3 rounded-2xl shadow-[0_4px_14px_rgba(61,90,254,0.4)]"
        >
          トップに戻る
        </Link>
      </main>
    );
  }

  const profile = loadProfile(mbti, zodiacJa);
  const fortuneBase = `/fortune?mbti=${mbti}&zodiac=${encodeURIComponent(zodiacJa)}&name=${encodeURIComponent(`${mbti}×${zodiacJa}`)}`;

  return (
    <main className="min-h-screen px-4 py-10 max-w-lg mx-auto">
      {/* Nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-sm font-bold text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors flex items-center gap-1"
        >
          &larr; 戻る
        </Link>
        <Link
          href="/"
          className="text-sm font-bold text-white bg-[#1a1a2e] px-4 py-2 rounded-full hover:bg-[#1a1a2e]/80 transition-colors"
        >
          トップへ
        </Link>
      </div>

      {/* Identity */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-full font-black text-sm shadow-[0_4px_16px_rgba(26,26,46,0.3)] mb-4">
          <span className="text-[#3D5AFE]">{mbti}</span>
          <span className="text-white/30">×</span>
          <span className="text-[#FF4D8B]">{zodiacJa}</span>
        </div>
        <p className="text-sm font-bold text-[#1a1a2e]/40">キャラクター分析</p>
      </div>

      {profile ? (
        <div className="space-y-4">
          {/* Catchcopy */}
          <div className="bg-[#1a1a2e] rounded-3xl p-8 shadow-[0_6px_24px_rgba(26,26,46,0.25)]">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">
              Character
            </p>
            <p className="text-3xl font-black text-white leading-snug">
              {profile.catchcopy}
            </p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100">
            <p className="text-sm font-bold leading-8 text-[#1a1a2e]/75">
              {profile.description}
            </p>
          </div>

          {/* Fortune CTAs */}
          <div className="space-y-3 pt-2">
            <Link
              href={`${fortuneBase}&category=weekly`}
              className="flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-[#3D5AFE] text-white font-black text-sm shadow-[0_4px_16px_rgba(61,90,254,0.4)] hover:-translate-y-0.5 transition-all duration-150"
            >
              <span>今週の運勢を見る</span>
              <span className="opacity-60">→</span>
            </Link>
            <Link
              href={`${fortuneBase}&category=monthly`}
              className="flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-[#FF4D8B] text-white font-black text-sm shadow-[0_4px_16px_rgba(255,77,139,0.4)] hover:-translate-y-0.5 transition-all duration-150"
            >
              <span>今月の運勢を見る</span>
              <span className="opacity-60">→</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🔮</p>
          <p className="font-black text-xl text-[#1a1a2e]/30">データ準備中</p>
          <p className="text-sm font-bold text-[#1a1a2e]/30">もうすぐ公開予定です</p>
        </div>
      )}
    </main>
  );
}