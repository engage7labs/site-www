import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "#1c1e20",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Emerald glow — top-left */}
        <div
          style={{
            position: "absolute",
            top: "-160px",
            left: "-160px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(61,190,115,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Emerald glow — bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(61,190,115,0.10) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
            width: "100%",
          }}
        >
          {/* Top: brand mark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#3dbe73",
                display: "flex",
              }}
            />
            <span
              style={{
                fontSize: "22px",
                fontWeight: 400,
                color: "#6b7280",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              engage7.ie
            </span>
          </div>

          {/* Middle: main copy */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              style={{
                fontSize: "68px",
                fontWeight: 700,
                color: "#f9fafb",
                lineHeight: 1.05,
                letterSpacing: "-2px",
              }}
            >
              Engage7
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: 400,
                color: "#d1d5db",
                lineHeight: 1.35,
                maxWidth: "780px",
              }}
            >
              From wearable signals to human-readable insights.
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 300,
                color: "#6b7280",
                letterSpacing: "0.01em",
              }}
            >
              Calm, explainable, and built for reflection.
            </div>
          </div>

          {/* Bottom: emerald accent bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "3px",
                background: "#3dbe73",
                borderRadius: "2px",
                display: "flex",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "3px",
                background: "#3dbe73",
                opacity: 0.5,
                borderRadius: "2px",
                display: "flex",
              }}
            />
            <div
              style={{
                width: "6px",
                height: "3px",
                background: "#3dbe73",
                opacity: 0.25,
                borderRadius: "2px",
                display: "flex",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
