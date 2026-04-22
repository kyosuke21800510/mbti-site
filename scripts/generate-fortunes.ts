#!/usr/bin/env npx tsx
/**
 * scripts/generate-fortunes.ts
 *
 * MBTI × 星座 × カテゴリ の全384パターンを事前生成してJSONに保存する。
 * 生成済みはスキップするので途中から再開できる。
 *
 * 実行: npx tsx scripts/generate-fortunes.ts
 * 必須: ANTHROPIC_API_KEY 環境変数
 *
 * 出力:
 *   public/fortunes/YYYY-MM.json     (今月の運勢)
 *   public/fortunes/YYYY-W{week}.json (今週の運勢)
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

// .env.local を自動ロード（npm script 経由でも動作するよう）
try {
  const envPath = path.join(process.cwd(), ".env.local");
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim();
  }
} catch { /* .env.local がなければ無視 */ }

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

const SYSTEM_PROMPT = `あなたはMBTI×星座で運勢を占う専門家です。
MBTIと星座それぞれの特性を深く理解した上で、
その組み合わせ特有の心理・行動パターンを分析して占ってください。
断言口調、共感型、600〜1000字。日本語。`;

const CATEGORY_LABEL: Record<Category, string> = {
  monthly: "今月の運勢",
  weekly:  "今週の運勢",
};

async function generateFortune(
  client: Anthropic,
  mbti: MBTIType,
  zodiac: ZodiacType,
  category: Category,
): Promise<FortuneData> {
  const isWeekly = category === "weekly";
  const periodWord = isWeekly ? "週" : "月";

  // 今週: summary のみ（sections 空）
  // 今月: summary（総評）＋ 人間関係・恋愛 の3セクション
  const sectionsInstruction = isWeekly
    ? `"sections": []`
    : `"sections": [
    { "label": "人間関係", "content": "3〜4文。上旬中旬下旬や曜日に言及しない。具体的な行動アドバイスを含む" },
    { "label": "恋愛",     "content": "3〜4文。上旬中旬下旬や曜日に言及しない。具体的な行動アドバイスを含む" }
  ]`;

  const summaryInstruction = isWeekly
    ? "週全体をひとつのまとまった文章で（6〜8文）。上旬中旬下旬・曜日に言及しない。葛藤や難しさも含めた心理描写で「わかってもらえた」と感じさせる"
    : "総評（4〜5文）。上旬中旬下旬・曜日に言及しない。葛藤や難しさも含めた心理描写で「わかってもらえた」と感じさせる";

  const userPrompt = `${zodiac}×${mbti}の${CATEGORY_LABEL[category]}を占って。

以下のJSON形式で返してください。

{
  "headline": "今${periodWord}の核心を突く一言（「〜はずです」「〜でしょう」調、25文字以内。名前は含めない）",
  "summary": "${summaryInstruction}",
  ${sectionsInstruction},
  "keyword": "今${periodWord}のキーワード（漢字2文字）",
  "luckyNumber": 幸運の数字（1〜9の整数）,
  "luckyColor": "ラッキーカラー（色の名前）"
}

全体600〜1000字。JSONのみ返すこと。`;

  const message = await client.messages.create({
    // コスト最適化のため Haiku を使用。Opus に変更したい場合は "claude-opus-4-6" に書き換えてください。
    model: "claude-haiku-4-5",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`JSONが見つかりません (${mbti}_${zodiac}_${category})`);
  return JSON.parse(jsonMatch[0]) as FortuneData;
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

  const targets: Array<{ label: string; category: Category; filePath: string }> = [
    {
      label: "今月の運勢",
      category: "monthly",
      filePath: path.join(outputDir, `${getISOMonthKey(now)}.json`),
    },
    {
      label: "今週の運勢",
      category: "weekly",
      filePath: path.join(outputDir, `${getISOWeekKey(now)}.json`),
    },
  ];

  const PER_CATEGORY = MBTI_TYPES.length * ZODIAC_TYPES.length; // 192
  const TOTAL = PER_CATEGORY * targets.length; // 384

  console.log("\n🔮 運勢テキスト事前生成スクリプト");
  for (const t of targets) {
    console.log(`  📄 ${t.label}: ${t.filePath}`);
  }
  console.log(`  📊 総パターン数: ${TOTAL} (${MBTI_TYPES.length} MBTI × ${ZODIAC_TYPES.length} 星座 × ${targets.length} カテゴリ)\n`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const { label, category, filePath } of targets) {
    console.log(`\n▶ ${label} を生成中 [${filePath}]`);
    const data = loadOrCreate(filePath);
    let count = 0;

    for (const mbti of MBTI_TYPES) {
      for (const zodiac of ZODIAC_TYPES) {
        count++;
        const key = `${mbti}_${zodiac}`;
        const prefix = `[${String(count).padStart(3, " ")}/${PER_CATEGORY}] ${mbti} × ${zodiac}`;

        if (data[key]) {
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

        // レート制限対策: 300ms 待機
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
