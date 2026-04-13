"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MBTI_TYPES, ZODIAC_TYPES, type MBTIType, type ZodiacType } from "@/lib/types";

// IN=青, EN=ピンク, IS=黄, ES=緑
const MBTI_GROUPS: Record<string, MBTIType[]> = {
  blue:   ["INTJ", "INTP", "INFJ", "INFP"],
  pink:   ["ENTJ", "ENTP", "ENFJ", "ENFP"],
  yellow: ["ISTJ", "ISFJ", "ISTP", "ISFP"],
  green:  ["ESTJ", "ESFJ", "ESTP", "ESFP"],
};

const GROUP_COLORS: Record<string, { selected: string; hover: string; shadow: string }> = {
  blue: {
    selected: "bg-[#3D5AFE] text-white border-[#3D5AFE]",
    hover: "hover:bg-[#3D5AFE]/10 hover:border-[#3D5AFE]",
    shadow: "shadow-[0_4px_14px_rgba(61,90,254,0.4)]",
  },
  pink: {
    selected: "bg-[#FF4D8B] text-white border-[#FF4D8B]",
    hover: "hover:bg-[#FF4D8B]/10 hover:border-[#FF4D8B]",
    shadow: "shadow-[0_4px_14px_rgba(255,77,139,0.4)]",
  },
  yellow: {
    selected: "bg-[#FFD600] text-[#1a1a2e] border-[#FFD600]",
    hover: "hover:bg-[#FFD600]/20 hover:border-[#FFD600]",
    shadow: "shadow-[0_4px_14px_rgba(255,214,0,0.5)]",
  },
  green: {
    selected: "bg-[#00C853] text-white border-[#00C853]",
    hover: "hover:bg-[#00C853]/10 hover:border-[#00C853]",
    shadow: "shadow-[0_4px_14px_rgba(0,200,83,0.4)]",
  },
};

function getMBTIGroup(type: MBTIType): string {
  for (const [group, types] of Object.entries(MBTI_GROUPS)) {
    if (types.includes(type)) return group;
  }
  return "blue";
}

const ZODIAC_COLORS = [
  { selected: "bg-[#FF4D8B] text-white border-[#FF4D8B] shadow-[0_4px_14px_rgba(255,77,139,0.4)]", hover: "hover:bg-[#FF4D8B]/10 hover:border-[#FF4D8B]" },
  { selected: "bg-[#FF7043] text-white border-[#FF7043] shadow-[0_4px_14px_rgba(255,112,67,0.4)]", hover: "hover:bg-[#FF7043]/10 hover:border-[#FF7043]" },
  { selected: "bg-[#FFD600] text-[#1a1a2e] border-[#FFD600] shadow-[0_4px_14px_rgba(255,214,0,0.5)]", hover: "hover:bg-[#FFD600]/20 hover:border-[#FFD600]" },
  { selected: "bg-[#00C853] text-white border-[#00C853] shadow-[0_4px_14px_rgba(0,200,83,0.4)]", hover: "hover:bg-[#00C853]/10 hover:border-[#00C853]" },
  { selected: "bg-[#00BCD4] text-white border-[#00BCD4] shadow-[0_4px_14px_rgba(0,188,212,0.4)]", hover: "hover:bg-[#00BCD4]/10 hover:border-[#00BCD4]" },
  { selected: "bg-[#3D5AFE] text-white border-[#3D5AFE] shadow-[0_4px_14px_rgba(61,90,254,0.4)]", hover: "hover:bg-[#3D5AFE]/10 hover:border-[#3D5AFE]" },
  { selected: "bg-[#7C4DFF] text-white border-[#7C4DFF] shadow-[0_4px_14px_rgba(124,77,255,0.4)]", hover: "hover:bg-[#7C4DFF]/10 hover:border-[#7C4DFF]" },
  { selected: "bg-[#E91E63] text-white border-[#E91E63] shadow-[0_4px_14px_rgba(233,30,99,0.4)]", hover: "hover:bg-[#E91E63]/10 hover:border-[#E91E63]" },
  { selected: "bg-[#FF6D00] text-white border-[#FF6D00] shadow-[0_4px_14px_rgba(255,109,0,0.4)]", hover: "hover:bg-[#FF6D00]/10 hover:border-[#FF6D00]" },
  { selected: "bg-[#546E7A] text-white border-[#546E7A] shadow-[0_4px_14px_rgba(84,110,122,0.4)]", hover: "hover:bg-[#546E7A]/10 hover:border-[#546E7A]" },
  { selected: "bg-[#29B6F6] text-white border-[#29B6F6] shadow-[0_4px_14px_rgba(41,182,246,0.4)]", hover: "hover:bg-[#29B6F6]/10 hover:border-[#29B6F6]" },
  { selected: "bg-[#26A69A] text-white border-[#26A69A] shadow-[0_4px_14px_rgba(38,166,154,0.4)]", hover: "hover:bg-[#26A69A]/10 hover:border-[#26A69A]" },
];

export default function Home() {
  const router = useRouter();
  const [mbti, setMbti] = useState<MBTIType | "">("");
  const [zodiac, setZodiac] = useState<ZodiacType | "">("");
  const [name, setName] = useState("");

  const canProceed = mbti && zodiac && name.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    router.push(
      `/select?mbti=${mbti}&zodiac=${encodeURIComponent(zodiac)}&name=${encodeURIComponent(name.trim())}`
    );
  };

  return (
    <main className="min-h-screen px-4 py-12 max-w-lg mx-auto bg-gradient-to-b from-white via-[#f8f6ff] to-white">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-block mb-4 animate-[spin_6s_linear_infinite]">
          <span className="text-5xl">🔮</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-[#3D5AFE] via-[#FF4D8B] to-[#FFD600] bg-clip-text text-transparent">
          MBTI × 星座占い
        </h1>
        <p className="text-base font-bold text-[#1a1a2e]/50 mt-1">
          あなただけの運勢を読み解く ✨
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Nickname */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100">
          <p className="text-sm font-bold text-[#1a1a2e]/50 uppercase tracking-wider mb-4">
            ① ニックネーム
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="あなたの名前を入力"
            maxLength={20}
            className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 text-base font-bold placeholder:text-gray-300 outline-none focus:border-[#3D5AFE] transition-colors"
          />
        </section>

        {/* MBTI */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100">
          <p className="text-sm font-bold text-[#1a1a2e]/50 uppercase tracking-wider mb-4">
            ② MBTIタイプ
          </p>
          <div className="grid grid-cols-4 gap-2">
            {MBTI_TYPES.map((type) => {
              const group = getMBTIGroup(type);
              const colors = GROUP_COLORS[group];
              const isSelected = mbti === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMbti(type)}
                  className={`
                    py-2.5 rounded-xl text-xs font-bold border-2 transition-all duration-150
                    ${isSelected
                      ? `${colors.selected} ${colors.shadow}`
                      : `border-gray-200 text-[#1a1a2e]/50 ${colors.hover}`
                    }
                  `}
                >
                  {type}
                </button>
              );
            })}
          </div>
          {mbti && (
            <p className="mt-3 text-center text-xs font-bold text-[#1a1a2e]/40">
              選択中：<span className="text-[#3D5AFE]">{mbti}</span>
            </p>
          )}
        </section>

        {/* Zodiac */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100">
          <p className="text-sm font-bold text-[#1a1a2e]/50 uppercase tracking-wider mb-4">
            ③ 星座
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ZODIAC_TYPES.map((type, i) => {
              const colors = ZODIAC_COLORS[i];
              const isSelected = zodiac === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setZodiac(type)}
                  className={`
                    py-3 rounded-2xl text-sm font-bold border-2 transition-all duration-150
                    ${isSelected
                      ? colors.selected
                      : `border-gray-200 text-[#1a1a2e]/50 ${colors.hover}`
                    }
                  `}
                >
                  {type}
                </button>
              );
            })}
          </div>
          {zodiac && (
            <p className="mt-3 text-center text-xs font-bold text-[#1a1a2e]/40">
              選択中：<span className="text-[#FF4D8B]">{zodiac}</span>
            </p>
          )}
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canProceed}
          className={`
            w-full py-5 rounded-3xl text-lg font-black tracking-wide transition-all duration-200
            ${canProceed
              ? "bg-[#1a1a2e] text-white shadow-[0_6px_24px_rgba(26,26,46,0.35)] hover:shadow-[0_8px_32px_rgba(26,26,46,0.45)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }
          `}
        >
          カテゴリを選ぶ →
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-[#1a1a2e]/25 font-bold">
        占い結果は毎週月曜日に更新されます
      </p>
    </main>
  );
}
