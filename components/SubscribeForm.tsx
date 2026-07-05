"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("done");
        setMessage(
          data.already ? "You're already subscribed." : "You're in — check your inbox!"
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="text-base font-semibold text-zinc-100">
        Get the daily digest by email
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Top developer stories, summarized, once a day. No spam.
      </p>
      {status === "done" ? (
        <p className="mt-3 text-sm font-medium text-cyan-400">{message}</p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="shrink-0 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
          >
            {status === "loading" ? "…" : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-400">{message}</p>
      )}
    </div>
  );
}
