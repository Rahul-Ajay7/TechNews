import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TechNews — developer news in one feed";

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
          <span>Tech</span>
          <span style={{ color: "#22d3ee" }}>News</span>
        </div>
        <div style={{ fontSize: 40, color: "#a1a1aa", marginTop: 24 }}>
          Developer news in one fast feed
        </div>
        <div style={{ fontSize: 28, color: "#71717a", marginTop: 48 }}>
          Hacker News + DEV · search · save · no ads · no login
        </div>
      </div>
    ),
    { ...size }
  );
}
