#!/usr/bin/env npx tsx
/**
 * scripts/generate-fortunes.ts
 *
 * MBTI × 星座 の全192パターンを事前生成してJSONに保存する。
 *
 * 実行: npx tsx scripts/generate-fortunes.ts
 * 必須: ANTHROPIC_API_KEY 環境変数
 * オプション: FORCE=1 で曜日/日付チェックをスキップ
 *
 * 出力:
 *   public/fortunes/YYYY-MM.json      (今月の運勢 — 毎月1日のみ生成)
 *   public/fortunes/YYYY-W{week}.json  (今週の運勢 — 毎週月曜に全再生成)
 */

import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import fs from "fs";
import { jsonrepair } from "jsonrepair";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// ---- 定数 ----

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

const ZODIAC_TYPES = [
  "おひつじ座", "おうし座", "ふたご座", "かに座",
  "しし座", "おとめ座", "てんびん座", "さそり座",
  "いて座", "やぎ座", "みずがめ座", "うお座",
] as const;

const ZODIAC_TRAITS: Record<string, string> = {
  "おひつじ座":  "衝動と行動力",
  "おうし座":   "安定への執着",
  "ふたご座":   "二面性と好奇心",
  "かに座":    "感受性と依存",
  "しし座":    "自己表現と承認欲求",
  "おとめ座":   "完璧主義と分析",
  "てんびん座":  "調和と優柔不断",
  "さそり座":   "執着と変容",
  "いて座":    "自由と理想主義",
  "やぎ座":    "野心と孤独",
  "みずがめ座":  "独自性と反骨",
  "うお座":    "共感と境界の曖昧さ",
};

const MBTI_TRAITS: Record<string, string> = {
  "INTJ": "戦略的思考と完璧主義、独立心と人間不信の裏側",
  "INTP": "論理優先と感情軽視、理論の迷宮にはまる傾向",
  "ENTJ": "支配欲と効率主義、感情を後回しにする野心家",
  "ENTP": "議論好きと反骨精神、実行力不足との戦い",
  "INFJ": "深い洞察と理想主義、燃え尽きやすい共感者",
  "INFP": "誠実さと内省過多、自己批判と夢想の間で揺れる",
  "ENFJ": "他者優先と自己犠牲、境界線を引けない世話焼き",
  "ENFP": "熱量の波と飽き性、可能性に溺れる自由人",
  "ISTJ": "責任感と頑固さ、変化への抵抗と安定への執着",
  "ISFJ": "献身と自己主張のなさ、報われなくても尽くし続ける",
  "ESTJ": "組織力と規則重視、融通の利かない管理欲",
  "ESFJ": "協調性と承認欲求、人の目を気にしすぎる調和者",
  "ISTP": "冷静な問題解決と感情の壁、深入りを避ける職人気質",
  "ISFP": "感受性豊かなマイペース、傷つきやすさを隠す芸術家",
  "ESTP": "即断即決の行動力、退屈との戦いと衝動性",
  "ESFP": "陽気な即興力と計画嫌い、感情で突き進む享楽家",
};

type MBTIType = (typeof MBTI_TYPES)[number];
type ZodiacType = (typeof ZODIAC_TYPES)[number];
type Category = "weekly" | "monthly";

interface FortuneSection {
  label: string;
  content: string;
}

interface FortuneData {
  headline: string;
  summary: string;
  sections: FortuneSection[];
  keyword: string;
  luckyNumber: number;
  luckyColor: string;
}

type FortuneFile = Record<string, FortuneData>;

// ---- 日付キー (lib/types と同じロジック) ----

function getISOWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getISOMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ---- AI生成 ----

const SYSTEM_PROMPT = `あなたはMBTI×星座の組み合わせで運勢を占う専門家です。
しいたけ占い風の文体を意識してください——断言口調で「あなたはこういう人です」と言い切り、
当事者が「わかってもらえた」と感じる共感型の描写を徹底します。
各組み合わせ固有の矛盾・強み・癖を具体的に描写し、
どのMBTI×星座にも当てはまる抽象的な言葉は使わないでください。
上旬・中旬・下旬・曜日への言及は禁止。日本語のみ。`;

const CATEGORY_LABEL: Record<Category, string> = {
  monthly: "今月の運勢",
  weekly:  "今週の運勢",
};

const WEEKDAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"] as const;

async function generateFortune(
  client: Anthropic,
  mbti: MBTIType,
  zodiac: ZodiacType,
  category: Category,
): Promise<FortuneData> {
  const isWeekly = category === "weekly";
  const periodWord = isWeekly ? "週" : "月";
  const zodiacTrait = ZODIAC_TRAITS[zodiac];
  const mbtiTrait = MBTI_TRAITS[mbti];

  const sectionsInstruction = isWeekly
    ? `"sections": []`
    : `"sections": [
    { "label": "人間関係", "content": "3〜4文。この組み合わせ特有の対人パターンと具体的なアドバイス" },
    { "label": "恋愛",     "content": "3〜4文。この組み合わせ特有の恋愛傾向と具体的なアドバイス" }
  ]`;

  const summaryInstruction = isWeekly
    ? "週全体をひとつのまとまった文章で（6〜8文）。この組み合わせだけが持つ葛藤・強み・癖を断言口調で描写し「わかってもらえた」と感じさせる。曜日や日付への言及なし"
    : "総評（4〜5文）。この組み合わせだけが持つ今月の核心を断言口調で。葛藤や難しさも含めて「わかってもらえた」と感じさせる。曜日や日付への言及なし";

  const userPrompt = `${zodiac}（${zodiacTrait}）×${mbti}（${mbtiTrait}）の${CATEGORY_LABEL[category]}を占って。

この2つの組み合わせだけが持つ矛盾・強み・癖を核心から描写してください。
「${zodiacTrait}」と「${mbtiTrait}」がぶつかる場面、噛み合う場面、どちらかが暴走する場面を具体的に描いてください。

以下のJSON形式で返してください。

{
  "headline": "今${periodWord}の核心を突く一言（断言口調、25文字以内、「〜はずです」「〜でしょう」も可、名前不要）",
  "summary": "${summaryInstruction}",
  ${sectionsInstruction},
  "keyword": "今${periodWord}のキーワード（漢字2文字）",
  "luckyNumber": 幸運の数字（1〜9の整数）,
  "luckyColor": "ラッキーカラー（色の名前）"
}

全体600〜1000字。JSONのみ返すこと。`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`JSONが見つかりません (${mbti}_${zodiac}_${category})`);
  return JSON.parse(jsonrepair(jsonMatch[0])) as FortuneData;
}

// ---- ファイル操作 ----

function loadOrCreate(filePath: string): FortuneFile {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as FortuneFile;
  }
  return {};
}

function save(filePath: string, data: FortuneFile): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ---- メイン ----

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY 環境変数を設定してください");
    process.exit(1);
  }

  const client = new Anthropic();
  const outputDir = path.join(process.cwd(), "public", "fortunes");
  const now = new Date();
  const isFirstOfMonth = now.getDate() === 1;
  const isMonday = now.getDay() === 1;
  const force = !!process.env.FORCE;

  type Target = {
    label: string;
    category: Category;
    filePath: string;
    /** true = 既存データを破棄して全件再生成（weekly の月曜動作） */
    overwrite: boolean;
  };

  const allTargets: Target[] = [
    {
      label: "今月の運勢",
      category: "monthly",
      filePath: path.join(outputDir, `${getISOMonthKey(now)}.json`),
      overwrite: false,
    },
    {
      label: "今週の運勢",
      category: "weekly",
      filePath: path.join(outputDir, `${getISOWeekKey(now)}.json`),
      overwrite: !force,
    },
  ];

  console.log("\n🔮 運勢テキスト事前生成スクリプト");

  // 日付チェック（FORCE=1 でスキップ可能）
  const targets: Target[] = [];
  for (const t of allTargets) {
    if (t.category === "monthly" && !isFirstOfMonth && !force) {
      console.log(`  ⏭ スキップ: ${t.label}（毎月1日のみ生成。現在は${now.getDate()}日）`);
      continue;
    }
    if (t.category === "weekly" && !isMonday && !force) {
      console.log(`  ⏭ スキップ: ${t.label}（毎週月曜のみ再生成。本日は${WEEKDAY_NAMES[now.getDay()]}曜日）`);
      continue;
    }
    targets.push(t);
  }

  if (targets.length === 0) {
    console.log("\n実行条件を満たすカテゴリがありません。");
    console.log("強制実行する場合は FORCE=1 を設定してください。\n");
    return;
  }

  const PER_CATEGORY = MBTI_TYPES.length * ZODIAC_TYPES.length; // 192
  const TOTAL = PER_CATEGORY * targets.length;

  for (const t of targets) {
    console.log(`  📄 ${t.label}: ${t.filePath}`);
  }
  console.log(`  📊 総パターン数: ${TOTAL} (${MBTI_TYPES.length} MBTI × ${ZODIAC_TYPES.length} 星座 × ${targets.length} カテゴリ)\n`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const { label, category, filePath, overwrite } of targets) {
    console.log(`\n▶ ${label} を生成中 [${filePath}]`);
    // weekly は月曜に全再生成するため既存データをクリア
    const data: FortuneFile = overwrite ? {} : loadOrCreate(filePath);
    let count = 0;

    for (const mbti of MBTI_TYPES) {
      for (const zodiac of ZODIAC_TYPES) {
        count++;
        const key = `${mbti}_${zodiac}`;
        const prefix = `[${String(count).padStart(3, " ")}/${PER_CATEGORY}] ${mbti} × ${zodiac}`;

        if (!overwrite && data[key]) {
          console.log(`  ✓ スキップ: ${prefix}`);
          totalSkipped++;
          continue;
        }

        process.stdout.write(`  ⏳ 生成中: ${prefix} ...`);
        try {
          const fortune = await generateFortune(client, mbti, zodiac, category);
          data[key] = fortune;
          save(filePath, data); // 1件ごとに保存（途中再開に対応）
          process.stdout.write(" ✅\n");
          totalGenerated++;
        } catch (err) {
          process.stdout.write(" ❌\n");
          console.error(`      エラー: ${(err as Error).message}`);
          totalErrors++;
        }

        // レート制限対策
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    const existingCount = Object.keys(data).length;
    console.log(`  → ${label} 完了: ${existingCount}/${PER_CATEGORY} パターン保存済`);
  }

  console.log("\n🎉 生成完了!");
  console.log(`  生成: ${totalGenerated} / スキップ: ${totalSkipped} / エラー: ${totalErrors} / 合計: ${TOTAL}`);
  if (totalErrors > 0) {
    console.log(`  ⚠ エラーが ${totalErrors} 件あります。再実行するとスキップされた分から再開できます。`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
