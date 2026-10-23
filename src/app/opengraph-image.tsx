import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Captih - Tunisian darija subtitle and transcription tool. Drop a video, get an SRT.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,92,43,0.22), transparent 60%), #0B0B0F",
          color: "#F4F1EA",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "72px",
        }}
      >
        {/* Top row — wordmark + caption chip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span
              style={{
                fontSize: 64,
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: "#F4F1EA",
              }}
            >
              Captih
            </span>
            <span style={{ fontSize: 28, color: "#FF5C2B", letterSpacing: "-0.02em" }}>
              كابتيه
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "1px solid #1E1E26",
              background: "rgba(22,22,28,0.6)",
              borderRadius: 999,
              padding: "10px 20px",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 18,
                color: "#8A857C",
              }}
            >
              00:00:12,400 → 00:00:14,820
            </span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span
            style={{
              fontSize: 84,
              fontWeight: 600,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              color: "#F4F1EA",
              maxWidth: "92%",
            }}
          >
            The first subtitle tool
          </span>
          <span
            style={{
              fontSize: 84,
              fontWeight: 600,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              color: "#FF5C2B",
              maxWidth: "92%",
            }}
          >
            that actually speaks Tunisian.
          </span>
        </div>

        {/* Bottom row — proof points */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#8A857C",
            fontSize: 24,
          }}
        >
          <span>93 hrs · real Tunisian audio</span>
          <span>SRT · TXT · JSON</span>
          <span style={{ color: "#F4F1EA" }}>captih.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
