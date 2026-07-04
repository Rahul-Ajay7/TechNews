import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://soft-tech-news.vercel.app";
const TITLE = "TechNews — developer news in one feed";
const DESCRIPTION =
  "Top stories from Hacker News and DEV in one fast, dark feed. Search, filter by source, and save stories for later. No ads, no login.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "tech news",
    "hacker news reader",
    "dev.to",
    "developer news",
    "programming news",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "TechNews",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 font-sans text-zinc-100">
        <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3.5">
            <a href="/" className="text-lg font-bold tracking-tight">
              Tech<span className="text-cyan-400">News</span>
            </a>
            <span className="text-xs text-zinc-500">
              Hacker News + DEV, refreshed every 5 min
            </span>
          </div>
        </header>
        {children}
        <footer className="border-t border-zinc-800/80 py-4 text-center text-xs text-zinc-600">
          Stories from public Hacker News and DEV APIs
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
