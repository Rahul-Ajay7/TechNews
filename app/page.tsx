import Feed from "@/components/Feed";
import AdSlot from "@/components/AdSlot";
import { fetchAllStories } from "@/lib/news";

export const revalidate = 300;

export default async function Home() {
  let stories: Awaited<ReturnType<typeof fetchAllStories>> = [];
  let loadError = false;
  try {
    stories = await fetchAllStories();
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 justify-center gap-6 px-4 py-6">
      <AdSlot label="Your ad here" />
      <div className="w-full max-w-3xl">
        {loadError ? (
          <p className="py-16 text-center text-sm text-zinc-500">
            Couldn&apos;t load the news feed. Check your connection and reload.
          </p>
        ) : (
          <Feed initialStories={stories} />
        )}
      </div>
      <AdSlot label="Sponsor a slot" />
    </main>
  );
}
