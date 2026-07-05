import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Signups aren't configured yet." },
      { status: 503 }
    );
  }

  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const res = await fetch("https://api.buttondown.email/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email }),
  });

  if (res.ok) {
    return NextResponse.json({ ok: true });
  }

  // Buttondown returns 400 with a message when the address already exists.
  const detail = await res.text();
  if (res.status === 400 && /already/i.test(detail)) {
    return NextResponse.json({ ok: true, already: true });
  }

  // Log the upstream failure so it shows in Vercel function logs; return the
  // upstream status (no secrets) to make misconfigured keys diagnosable.
  console.error(`Buttondown ${res.status}: ${detail.slice(0, 300)}`);
  return NextResponse.json(
    {
      error: "Couldn't sign you up. Try again later.",
      upstreamStatus: res.status,
      // TODO: remove after debugging signup failures.
      upstreamDetail: detail.slice(0, 300),
    },
    { status: 502 }
  );
}
