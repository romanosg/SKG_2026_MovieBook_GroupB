import React from "react";
import {
  DEFAULT_PALETTE,
  DEFAULT_CORNER_WIDTH,
  PaletteContext,
} from "../utils/theme";

const FONT = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

// The base structure of a page: background, text color, font and the space around the content.
//
//   <PageLayout>...</PageLayout>
//   <PageLayout palette={{ accent: "#f5b301" }} cornerWidth={{ x: 40, y: 24 }}>...</PageLayout>
//
// palette:     any of background, text, accent, surface, border (the rest keep their default)
// cornerWidth: space between the page's edges and its content, in pixels:
//              one number for every side, or { x, y } for left/right and top/bottom
// style:       extra styles for this page only, e.g. style={{ display: "flex" }}
//
// Colors in other components: usePalette() works in components rendered INSIDE the layout.
// A page that renders <PageLayout> itself is outside it, so there use CSS variables instead,
// e.g. color: "var(--page-accent)".
export default function PageLayout({
  palette,
  cornerWidth = DEFAULT_CORNER_WIDTH,
  style,
  children,
}) {
  const colors = { ...DEFAULT_PALETTE, ...palette };

  const x = typeof cornerWidth === "number" ? cornerWidth : cornerWidth.x ?? DEFAULT_CORNER_WIDTH;
  const y = typeof cornerWidth === "number" ? cornerWidth : cornerWidth.y ?? DEFAULT_CORNER_WIDTH;

  return (
    // Components inside can read the colors with usePalette()
    <PaletteContext.Provider value={colors}>
      <main
        style={{
          // The same colors as CSS variables, for <style> blocks: var(--page-accent)
          "--page-background": colors.background,
          "--page-text": colors.text,
          "--page-accent": colors.accent,
          "--page-surface": colors.surface,
          "--page-border": colors.border,

          flex: 1, // fills the space under the header bar
          width: "100%",
          boxSizing: "border-box",
          background: colors.background,
          color: colors.text,
          padding: `${y}px ${x}px`,
          fontFamily: FONT,
          ...style,
        }}
      >
        {children}
      </main>
    </PaletteContext.Provider>
  );
}
