import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Branded Open Graph / social-share card, generated as a 1200x630 PNG.
// Next wires this into <meta property="og:image"> (and twitter:image) and
// resolves the URL against `metadataBase` (see app/layout.tsx).

export const alt =
  "Finlio — Know why your money moved. One plain-English message every market morning.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand tokens (kept in sync with globals.css).
const CREAM = "#fbfaf9";
const INK = "#343433";
const BODY = "#474645";
const LINE = "#ecebe7";
const GREEN = "#34c759";

export default async function OpengraphImage() {
  // The real Finlio mark. The asset has a white background baked in, so it sits
  // cleanly inside the white tile below (white × white = invisible box).
  const markData = await readFile(join(process.cwd(), "public/finlion-mark.png"));
  const markSrc = `data:image/png;base64,${markData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CREAM,
          padding: 76,
        }}
      >
        {/* Brand lockup */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 68,
              height: 68,
              borderRadius: 18,
              background: "#ffffff",
              border: `1px solid ${LINE}`,
              marginRight: 18,
            }}
          >
            <img src={markSrc} width={44} height={44} alt="" />
          </div>
          <div style={{ fontSize: 38, fontWeight: 700, color: INK, letterSpacing: -1 }}>
            Finlio
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -3,
            lineHeight: 1.04,
          }}
        >
          <div style={{ display: "flex" }}>Know why your</div>
          <div style={{ display: "flex" }}>
            <span style={{ marginRight: 24 }}>money</span>
            <span style={{ color: GREEN }}>moved</span>
            <span>.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 400,
              color: BODY,
              letterSpacing: -0.4,
              marginTop: 30,
            }}
          >
            One plain-English message every market morning.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 28, color: BODY }}>finlio.app</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 26,
              color: INK,
            }}
          >
            <div
              style={{
                width: 13,
                height: 13,
                borderRadius: 999,
                background: GREEN,
                marginRight: 12,
              }}
            />
            <span>Early access</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
