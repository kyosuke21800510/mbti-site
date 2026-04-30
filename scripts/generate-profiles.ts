#!/usr/bin/env npx tsx
/**
 * scripts/generate-profiles.ts
 *
 * MBTI × 星座 の全192パターンのプロフィール特徴文を生成してJSONに保存する。
 *
 * 実行: npx tsx scripts/generate-profiles.ts
 * 必須: ANTHROPIC_API_KEY 環境変数
 *
 * 出力: public/profiles/profiles.json
 * 生成済みのエントリはスキップして途中再開できる。
 */

import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import fs from "fs";
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

interface ProfileData {
  catchcopy: string;
  description: string;
}

type ProfileFile = Record<string, ProfileData>;

// ---- AI生成 ----

const SYSTEM_PROMPT = `MBTI×星座の組み合わせの特徴を説明する専門家。\
この組み合わせだけが持つ固有の矛盾・強み・癖を描写すること。\
他の組み合わせと同じ表現や切り口にならないよう注意。\
断言口調・共感型・400字程度・日本語。\
必ずJSON形式で返す：{"catchcopy": "○○の○○", "description": "..."}`;

async function generateProfile(
  client: Anthropic,
  mbti: string,
  zodiac: string,
): Promise<ProfileData> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `${zodiac}×${mbti}の人の特徴を説明して。` }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`JSONが見つかりません (${mbti}_${zodiac})`);
  return JSON.parse(jsonMatch[0]) as ProfileData;
}

// ---- ファイル操作 ----

function loadOrCreate(filePath: string): ProfileFile {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as ProfileFile;
  }
  return {};
}

function save(filePath: string, data: ProfileFile): void {
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
  const filePath = path.join(process.cwd(), "public", "profiles", "profiles.json");
  const data = loadOrCreate(filePath);

  const TOTAL = MBTI_TYPES.length * ZODIAC_TYPES.length; // 192
  console.log("\n🔮 MBTI×星座 プロフィール生成スクリプト");
  console.log(`  📊 総パターン数: ${TOTAL} (${MBTI_TYPES.length} MBTI × ${ZODIAC_TYPES.length} 星座)`);
  console.log(`  📄 出力先: ${filePath}\n`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;
  let count = 0;

  for (const mbti of MBTI_TYPES) {
    for (const zodiac of ZODIAC_TYPES) {
      count++;
      const key = `${mbti}_${zodiac}`;
      const prefix = `[${String(count).padStart(3, " ")}/${TOTAL}] ${mbti} × ${zodiac}`;

      if (data[key]) {
        console.log(`  ✓ スキップ: ${prefix}`);
        skipped++;
        continue;
      }

      process.stdout.write(`  ⏳ 生成中: ${prefix} ...`);
      try {
        const profile = await generateProfile(client, mbti, zodiac);
        data[key] = profile;
        save(filePath, data); // 1件ごとに保存（途中再開に対応）
        process.stdout.write(" ✅\n");
        generated++;
      } catch (err) {
        process.stdout.write(" ❌\n");
        console.error(`      エラー: ${(err as Error).message}`);
        errors++;
      }

      // レート制限対策
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log("\n🎉 生成完了!");
  console.log(`  生成: ${generated} / スキップ: ${skipped} / エラー: ${errors} / 合計: ${TOTAL}`);
  if (errors > 0) {
    console.log(`  ⚠ エラーが ${errors} 件あります。再実行するとスキップされた分から再開できます。`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
