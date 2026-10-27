import React, { useLayoutEffect, useMemo } from "react";
import {
  DEFAULT_PALETTE,
  DEFAULT_CORNER_WIDTH,
  PaletteContext,
  applyPalette,
  getPagePalette,
} from "../utils/theme";

const FONT = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

// The base structure of a page: colors, font and the space around the content.
//
//   <PageLayout page="home">...</PageLayout>
//
// page:        which page this is. Its colors come from PAGE_PALETTES in utils/theme.js
//              (home, movie, profile, reviews, signIn, signUp). Unknown = default colors.
// palette:     optional extra colors for this one use, on top of the page's colors
// cornerWidth: space between the page's edges and its content, in pixels:
//              one number for every side, or { x, y } for left/right and top/bottom
// style:       extra styles, e.g. style={{ display: "flex" }}
//
// While a page is open its colors are applied to the WHOLE document, so the header bar
// and the page sides follow it too. Everything reads them with var(--page-...).
export default function PageLayout({
  page,
  palette,
  cornerWidth = DEFAULT_CORNER_WIDTH,
  style,
  children,
}) {
  const overridesKey = JSON.stringify(palette ?? {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const colors = useMemo(() => getPagePalette(page, palette), [page, overridesKey]);

  // Before the page is drawn: apply its colors. When it closes: back to the defaults.
  useLayoutEffect(() => {
    applyPalette(colors);
    return () => applyPalette(DEFAULT_PALETTE);
  }, [colors]);

  const x = typeof cornerWidth === "number" ? cornerWidth : cornerWidth.x ?? DEFAULT_CORNER_WIDTH;
  const y = typeof cornerWidth === "number" ? cornerWidth : cornerWidth.y ?? DEFAULT_CORNER_WIDTH;

  return (
    <PaletteContext.Provider value={colors}>
      <main
        style={{
          flex: 1, // fills the space under the header bar
          width: "100%",
          boxSizing: "border-box",
          background: "var(--page-background)",
          color: "var(--page-text)",
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
