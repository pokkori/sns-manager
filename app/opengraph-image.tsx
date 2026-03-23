import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SNS自動投稿管理 - X・TikTok投稿を自動生成・スケジュール管理";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
          }}
        />

        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 24,
            padding: "60px 80px",
            gap: 24,
          }}
        >
          {/* Icon row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
            <div
              style={{
                background: "rgba(59,130,246,0.2)",
                border: "1px solid rgba(59,130,246,0.4)",
                borderRadius: 12,
                padding: "8px 20px",
                color: "#93c5fd",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              X(Twitter)
            </div>
            <div
              style={{
                background: "rgba(236,72,153,0.2)",
                border: "1px solid rgba(236,72,153,0.4)",
                borderRadius: 12,
                padding: "8px 20px",
                color: "#f9a8d4",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              TikTok
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: -2,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            SNS自動投稿管理
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.65)",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            AIが最適な投稿文を自動生成・スケジュール管理
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            color: "rgba(255,255,255,0.35)",
            fontSize: 20,
          }}
        >
          sns-auto-post.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
