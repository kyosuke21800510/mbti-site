import type { MetadataRoute } from "next";
import { MBTI_TYPES, ZODIAC_SLUGS } from "@/lib/types";
import { ARTICLES } from "@/lib/blog";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.mbti-seiza.com";
const ZODIAC_SLUG_VALUES = Object.values(ZODIAC_SLUGS);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/select`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogPages: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const profilePages: MetadataRoute.Sitemap = MBTI_TYPES.flatMap((mbti) =>
    ZODIAC_SLUG_VALUES.map((zodiac) => ({
      url: `${BASE_URL}/profile/${mbti}/${zodiac}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  return [...staticPages, ...blogPages, ...profilePages];
}
