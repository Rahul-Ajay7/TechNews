import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Cometry — developer news in one feed";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          <span>Comet</span>
          <span style={{ color: "#22d3ee" }}>ry</span>
        </div>
        <div style={{ fontSize: 40, color: "#a1a1aa", marginTop: 24 }}>
          Developer news in one fast feed
        </div>
        <div style={{ fontSize: 28, color: "#71717a", marginTop: 40 }}>
          Hacker News + DEV · search · save · no ads · no login
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 56,
            padding: "18px 40px",
            fontSize: 32,
            fontWeight: 700,
            color: "#09090b",
            background: "#22d3ee",
            borderRadius: 14,
            alignSelf: "flex-start",
          }}
        >
          Read the feed →
        </div>
      </div>
    ),
    { ...size }
  );
}
