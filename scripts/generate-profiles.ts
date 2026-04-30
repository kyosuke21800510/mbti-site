#!/usr/bin/env npx tsx
/**
 * scripts/generate-profiles.ts
 *
 * MBTI x 星座 の全192パターンのプロフィール特徴文を生成してJSONに保存する。
 *
 * 実行: npm run generate-profiles
 * 必須: ANTHROPIC_API_KEY (.env.local に設定)
 * オプション:
 *   TEST=1   INTJ x おひつじ座 の1件だけ生成してテスト
 *   FORCE=1  既存データを無視して全件再生成
 *
 * 出力: public/profiles/profiles.json
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

const SYSTEM_PROMPT = [
  "MBTI×星座の組み合わせの特徴を説明する専門家。",
  "この組み合わせだけが持つ固有の矛盾・強み・癖を描写すること。",
  "他の組み合わせと同じ表現や切り口にならないよう注意。",
  "断言口調・共感型・400字程度・日本語。",
  '必ずJSON形式のみで返すこと（前後に説明文不要）: {"catchcopy": "○○の○○", "description": "..."}',
].join("\n");

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

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
  if (!text) throw new Error("空のレスポンス");

  // JSONブロックを抽出
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`JSONが見つかりません。レスポンス: ${text.slice(0, 100)}`);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`JSON解析失敗: ${(e as Error).message}`);
  }

  if (typeof parsed.catchcopy !== "string" || typeof parsed.description !== "string") {
    throw new Error(`不正なフィールド: ${JSON.stringify(parsed).slice(0, 100)}`);
  }

  return { catchcopy: parsed.catchcopy, description: parsed.description };
}

// ---- ファイル操作 ----

function loadOrCreate(filePath: string): ProfileFile {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as ProfileFile;
  } catch {
    console.warn("[WARN] profiles.json が破損しています。空から再開します。");
    return {};
  }
}

function save(filePath: string, data: ProfileFile): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ---- メイン ----

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ERROR] ANTHROPIC_API_KEY が未設定です");
    console.error("        .env.local に ANTHROPIC_API_KEY=sk-ant-... を追加してください");
    process.exit(1);
  }
  console.log(`[INFO] API Key: ${apiKey.slice(0, 20)}...`);

  const isTest  = process.env.TEST  === "1";
  const isForce = process.env.FORCE === "1";

  const client   = new Anthropic();
  const filePath = path.join(process.cwd(), "public", "profiles", "profiles.json");
  const data     = isForce ? {} : loadOrCreate(filePath);

  const allPairs = MBTI_TYPES.flatMap((mbti) =>
    ZODIAC_TYPES.map((zodiac) => ({ mbti, zodiac }))
  );
  const pairs = isTest ? [allPairs[0]] : allPairs;
  const TOTAL = pairs.length;

  if (isTest) {
    console.log("[TEST] 1件のみ生成します: INTJ x おひつじ座\n");
  } else {
    console.log(`[INFO] 総パターン数: ${TOTAL}`);
    console.log(`[INFO] 出力先: ${filePath}`);
    if (isForce) console.log("[INFO] FORCE=1: 全件再生成");
    console.log("");
  }

  let generated = 0;
  let skipped   = 0;
  let errors    = 0;

  for (let i = 0; i < pairs.length; i++) {
    const { mbti, zodiac } = pairs[i];
    const key    = `${mbti}_${zodiac}`;
    const prefix = `[${String(i + 1).padStart(3, " ")}/${TOTAL}] ${mbti} x ${zodiac}`;

    if (!isTest && !isForce && data[key]) {
      console.log(`  skip: ${prefix}`);
      skipped++;
      continue;
    }

    process.stdout.write(`  gen:  ${prefix} ... `);
    try {
      const profile = await generateProfile(client, mbti, zodiac);
      data[key] = profile;
      save(filePath, data);
      process.stdout.write("OK\n");
      if (isTest) {
        console.log(`\n  catchcopy:   ${profile.catchcopy}`);
        console.log(`  description: ${profile.description.slice(0, 60)}...`);
      }
      generated++;
    } catch (err) {
      process.stdout.write("FAIL\n");
      console.error(`  --> ${(err as Error).message}`);
      errors++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n[DONE] generated=${generated} skipped=${skipped} errors=${errors} total=${TOTAL}`);
  if (errors > 0) {
    console.log(`[WARN] ${errors}件のエラーがあります。再実行すると続きから再開できます。`);
  }
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
