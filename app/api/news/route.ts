import { NextResponse } from "next/server";
import { fetchAllStories } from "@/lib/news";

export async function GET() {
  try {
    const stories = await fetchAllStories();
    return NextResponse.json({ stories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 502 }
    );
  }
}
