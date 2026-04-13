import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { type FortuneData, type Category } from "@/lib/types";

// ---- Dummy data ----

function dummyWeekly(mbti: string, zodiac: string, name: string): FortuneData {
  const isI = mbti.startsWith("I");
  return {
    headline: `${name}さん、今週は${isI ? "内側に答えがある" : "動いた分だけ開ける"}はずです。`,
    summary: `${mbti}×${zodiac}のあなたにとって、今週は「自分を信じて動く」ことが鍵になるはずです。周囲の評価よりも、自分の感覚を優先していいでしょう。頭の中にあるモヤモヤを言葉にしてみると、驚くほどスッキリするはずです。週の半ばには、ずっと迷っていたことへの答えが自然と出てくるでしょう。焦らなくていいのです。あなたのペースで進んでいくことが、一番の近道になるはずです。週末には大切な人との時間が待っているでしょう。その温かさが、来週へのエネルギーになるはずです。`,
    sections: [],
    keyword: "信頼",
    luckyNumber: 7,
    luckyColor: "コバルトブルー",
  };
}

function dummyMonthly(mbti: string, zodiac: string, name: string): FortuneData {
  const isN = mbti[1] === "N";
  return {
    headline: `${name}さん、今月は${isN ? "直感が未来を照らす" : "積み重ねが実を結ぶ"}月でしょう。`,
    summary: `${mbti}×${zodiac}のあなたにとって、今月はひとつの転換点になるはずです。何かを手放すことで、新しいものが入ってくる準備が整うでしょう。その変化を、恐れないでください。`,
    sections: [
      { label: "人間関係", content: "深い話ができる相手が現れるはずです。表面的なつながりよりも、本音を話せる関係を大切にしていいでしょう。" },
      { label: "恋愛", content: "感情を素直に表現することが、今月の鍵になるはずです。言葉にしなければ伝わらないことも、あるでしょう。" },
    ],
    keyword: "転換",
    luckyNumber: 3,
    luckyColor: "深紅",
  };
}

const DUMMY_MAP: Record<Category, (m: string, z: string, n: string) => FortuneData> = {
  weekly: dummyWeekly,
  monthly: dummyMonthly,
};

// ---- AI generation ----

const SYSTEM_PROMPT = `あなたはMBTI×血液型で運勢を占うプロです。
しいたけ占いのような文体で書いてください。

文体の特徴：
- 「〜なはずです」「〜でしょう」の断言口調を使う
- 心理描写が深く、読んだ人が「わかってもらえた」と感じる表現
- ポジティブな面だけでなく、葛藤や難しさも正直に書く
- 具体的なシーン（会話・行動・場所）を交えたアドバイスを含む
- 全体の文字数は600〜800字程度
- 日本語で書く`;

const CATEGORY_CONTEXT: Record<Category, string> = {
  weekly: "今週（月曜〜日曜）の運勢。曜日では分けず、週全体をひとつのまとまった文章で書く。sectionsは空配列にすること。",
  monthly: "今月の運勢。「人間関係」と「恋愛」の2セクションのみで書く。",
};

async function generateWithAI(
  mbti: string, zodiac: string, name: string, category: Category
): Promise<FortuneData> {
  const client = new Anthropic();

  const periodWord = category === "weekly" ? "週" : "月";
  const sectionsInstruction = category === "weekly"
    ? `"sections": []`
    : `"sections": [
    { "label": "人間関係", "content": "内容（3〜4文。具体的なシーンや行動アドバイスを含む）" },
    { "label": "恋愛", "content": "内容（3〜4文。具体的なシーンや行動アドバイスを含む）" }
  ]`;

  const summaryInstruction = category === "weekly"
    ? "週全体の運勢（6〜8文。曜日では分けず、ひとつのまとまった文章で。葛藤や難しさも含めた正直な心理描写。読んだ人が「わかってもらえた」と感じるように）"
    : "総評（4〜5文。葛藤や難しさも含めた正直な心理描写。読んだ人が「わかってもらえた」と感じるように）";

  const userPrompt = `MBTIが${mbti}、星座が${zodiac}の人の${CATEGORY_CONTEXT[category]}

以下のJSON形式で返してください。

{
  "headline": "${name}さんへの一言（「〜はずです」「〜でしょう」調、25文字以内）",
  "summary": "${summaryInstruction}",
  ${sectionsInstruction},
  "keyword": "今${periodWord}のキーワード（漢字2文字）",
  "luckyNumber": 幸運の数字（1〜9の整数）,
  "luckyColor": "ラッキーカラー（色の名前）"
}

全体の合計が600〜800字になるように書くこと。JSONのみ返すこと。`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  return JSON.parse(jsonMatch[0]) as FortuneData;
}

// ---- Route handler ----

export async function POST(req: NextRequest) {
  try {
    const { mbti, zodiac, category, name = "あなた" } = await req.json();

    if (!mbti || !zodiac || !category) {
      return NextResponse.json({ error: "mbti, zodiac, and category are required" }, { status: 400 });
    }

    const cat = category as Category;
    let fortune: FortuneData;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        fortune = await generateWithAI(mbti, zodiac, name, cat);
      } catch {
        fortune = DUMMY_MAP[cat]?.(mbti, zodiac, name) ?? dummyWeekly(mbti, zodiac, name);
      }
    } else {
      fortune = DUMMY_MAP[cat]?.(mbti, zodiac, name) ?? dummyWeekly(mbti, zodiac, name);
    }

    return NextResponse.json(fortune);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
