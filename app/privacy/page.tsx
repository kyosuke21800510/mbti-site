import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | MBTI星座占い",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-black mb-8 text-[#1a1a2e]">プライバシーポリシー</h1>

      <div className="space-y-8 text-sm text-[#1a1a2e]/80 leading-relaxed">
        <section>
          <h2 className="font-black text-base text-[#1a1a2e] mb-2">サイトについて</h2>
          <p>
            本サービス「MBTI星座占い」は、MBTIタイプと星座を組み合わせた運勢占いを提供します。
          </p>
        </section>

        <section>
          <h2 className="font-black text-base text-[#1a1a2e] mb-2">広告について</h2>
          <p>
            本サービスでは、Google AdSenseによる広告を掲載しています。
            Google AdSenseはCookieを使用して、ユーザーの興味に応じた広告を表示します。
            Cookieの使用を無効にする場合は、ブラウザの設定からCookieを無効にしてください。
            詳細はGoogleの広告ポリシーをご確認ください。
          </p>
        </section>

        <section>
          <h2 className="font-black text-base text-[#1a1a2e] mb-2">アクセス解析について</h2>
          <p>
            本サービスでは、サービス改善を目的としてアクセス解析ツールを利用する場合があります。
            アクセス解析ツールはCookieを使用してデータを収集しますが、個人を特定する情報は含まれません。
          </p>
        </section>

        <section>
          <h2 className="font-black text-base text-[#1a1a2e] mb-2">お問い合わせ</h2>
          <p>
            本サービスに関するお問い合わせは、
            <Link href="/contact" className="text-[#3D5AFE] font-bold hover:underline mx-1">
              お問い合わせページ
            </Link>
            からお願いします。
          </p>
        </section>

        <p className="text-xs text-[#1a1a2e]/40 pt-4 border-t border-gray-100">
          最終更新日：2026年4月23日
        </p>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-sm font-bold text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors">
          ← トップへ戻る
        </Link>
      </div>
    </main>
  );
}
