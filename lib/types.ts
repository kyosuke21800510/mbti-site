export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export const ZODIAC_TYPES = [
  "おひつじ座", "おうし座", "ふたご座", "かに座",
  "しし座", "おとめ座", "てんびん座", "さそり座",
  "いて座", "やぎ座", "みずがめ座", "うお座",
] as const;
export const CATEGORIES = ["weekly", "monthly"] as const;

export type MBTIType = (typeof MBTI_TYPES)[number];
export type ZodiacType = (typeof ZODIAC_TYPES)[number];
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  weekly: "今週の運勢",
  monthly: "今月の運勢",
};

export const CATEGORY_EMOJIS: Record<Category, string> = {
  weekly: "📅",
  monthly: "🌙",
};

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; shadow: string }> = {
  weekly:  { bg: "#3D5AFE", text: "#ffffff", shadow: "rgba(61,90,254,0.4)" },
  monthly: { bg: "#FF4D8B", text: "#ffffff", shadow: "rgba(255,77,139,0.4)" },
};

export interface FortuneSection {
  title: string;
  content: string;
}

export interface FortuneData {
  headline: string;
  summary: string;
  sections: FortuneSection[];
  keyword: string;
  luckyNumber: number;
  luckyColor: string;
}

export interface CachedFortune {
  data: FortuneData;
  dateKey: string;
  mbti: MBTIType;
  category: Category;
}

/** ISO week key e.g. "2025W15" */
export function getISOWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** ISO month key e.g. "2025-04" */
export function getISOMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getCacheKey(mbti: string, zodiac: string, category: string): string {
  const dateKey = category === "monthly" ? getISOMonthKey() : getISOWeekKey();
  return `oracle_${mbti}_${zodiac}_${category}_${dateKey}`;
}
