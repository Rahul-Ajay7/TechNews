import { fetchAllStories } from "./news";
import type { Story } from "./types";

export interface DigestItem {
  story: Story;
  blurb: string;
}

export interface Digest {
  intro: string;
  items: DigestItem[];
  generatedAt: string;
}

const MODEL = "gemini-2.0-flash";
const DIGEST_SIZE = 12;

// Scores aren't comparable across sources (GitHub stars run into the tens of
// thousands, HN points into the hundreds), so ranking purely by score buries
// everything under GitHub. Instead take the best few from each source, then
// interleave for a balanced digest.
function pickTopBalanced(stories: Story[]): Story[] {
  const bySource = new Map<string, Story[]>();
  for (const story of stories) {
    const bucket = bySource.get(story.source) ?? [];
    bucket.push(story);
    bySource.set(story.source, bucket);
  }
  for (const bucket of bySource.values()) {
    bucket.sort((a, b) => b.score - a.score);
  }

  const picked: Story[] = [];
  const buckets = [...bySource.values()];
  for (let round = 0; picked.length < DIGEST_SIZE; round++) {
    let addedThisRound = false;
    for (const bucket of buckets) {
      if (bucket[round]) {
        picked.push(bucket[round]);
        addedThisRound = true;
        if (picked.length === DIGEST_SIZE) break;
      }
    }
    if (!addedThisRound) break;
  }
  return picked;
}

// Picks the top stories by score, then asks Gemini for a one-line "why it
// matters" per story plus a short intro. Returns null when no API key is set
// so the page can degrade to a plain top list.
export async function buildDigest(): Promise<Digest | null> {
  const key = process.env.GEMINI_API_KEY;
  const all = await fetchAllStories();
  const top = pickTopBalanced(all);

  if (!key) return null;

  const list = top
    .map((s, i) => `${i}. [${s.source}] ${s.title}`)
    .join("\n");

  const prompt = `You are the editor of a developer tech-news digest. Below are today's top ${top.length} stories (index, source, title).

${list}

Write a punchy daily digest. Return ONLY JSON matching:
{"intro": string, "items": [{"i": number, "blurb": string}]}

- "intro": one energetic sentence (max 20 words) summarizing the day's theme in tech.
- "items": one object per story index above, "blurb" = a 12-18 word "why it matters" note. Be concrete and skimmable. No hype words, no emojis.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          responseMimeType: "application/json",
        },
      }),
      // Cache the generated digest for an hour to stay within free limits.
      next: { revalidate: 3600 },
    }
  );
  if (!res.ok) throw new Error(`Gemini API responded ${res.status}`);

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const parsed: { intro: string; items: { i: number; blurb: string }[] } =
    JSON.parse(text);

  const items: DigestItem[] = parsed.items
    .filter((item) => top[item.i])
    .map((item) => ({ story: top[item.i], blurb: item.blurb }));

  return {
    intro: parsed.intro,
    items,
    generatedAt: new Date().toISOString(),
  };
}

// Fallback used when there's no API key or Gemini fails: just the top stories.
export async function topStories(): Promise<Story[]> {
  const all = await fetchAllStories();
  return pickTopBalanced(all);
}
