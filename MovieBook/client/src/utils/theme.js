import { createContext, useContext } from "react";

// =====================================================================================
//  ALL THE SITE'S COLORS ARE DEFINED IN THIS FILE.
//  1) DEFAULT_PALETTE: the colors every page uses (they are the colors the site has now)
//  2) PAGE_PALETTES:   colors that differ on a specific page (empty = use the defaults)
// =====================================================================================

export const DEFAULT_PALETTE = {
  // ---- The page --------------------------------------------------------------------
  background: "#121212", // background of the page (the center)
  sides: null, //       the empty areas left and right of the page. null = leave as index.css has it
  sidesBorder: null, // the thin lines along the edges of the page column. null = leave as index.css has it

  // ---- Fills (backgrounds of parts of the page) --------------------------------------
  navbar: "#1b1b1b", //       the header bar
  surface: "#242424", //      profile card, movie cards, input boxes, popups, page buttons
  surfaceDark: "#1b1b1b", //  text areas inside cards (like "About me")

  // ---- Blue (accent) -----------------------------------------------------------------
  accent: "#8ab4f8", //       blue buttons, links, checkboxes, highlights
  textOnAccent: "#1b1b1b", // text written on top of blue buttons

  // ---- Borders (lines that separate elements) ----------------------------------------
  border: "#4a4a4a", //     outlines of input boxes, cards and buttons
  borderSoft: "#3a3a3a", // subtle lines: under the header bar, dividers

  // ---- Text --------------------------------------------------------------------------
  text: "#e8e8e8", //       main text
  textStrong: "#ffffff", // highlighted text (the current header link, text on red buttons)
  heading: "#f3f4f6", //    titles (h1 and h2)
  textSoft: "#bdbdbd", //   header links that aren't selected, small labels
  textMuted: "#9a9a9a", //  hints, placeholders, secondary text
  textFaint: "#5a5a5a", //  "nothing written yet" messages

  // ---- Status and other ----------------------------------------------------------------
  danger: "#e5534b", //     Delete / Log out buttons, invalid password
  dangerText: "#ff8a80", // error messages
  success: "#3fb950", //    valid password
  star: "#f5b301", //       filled review stars
  avatar: "#8b95a7", //     the circle behind a profile letter
  overlay: "rgba(0, 0, 0, 0.6)", // dimmed background behind popups
};

// -------------------------------------------------------------------------------------
//  Colors that change on specific pages. Only write the colors that differ:
//  everything you leave out uses DEFAULT_PALETTE.
//  Example:  profile: { surface: "#2a2233", accent: "#f5b301" },
//  (the header bar and the page sides follow the page that is open)
// -------------------------------------------------------------------------------------
export const PAGE_PALETTES = {
  home: {},
  movie: {},
  profile: {},
  reviews: {},
  signIn: {},
  signUp: {},
};

// Space between the page's edges and its content, in pixels
export const DEFAULT_CORNER_WIDTH = 24;

// ---------------------------------- the machinery ----------------------------------

// The colors a page uses: defaults, then that page's colors, then any extra overrides
export const getPagePalette = (page, overrides) => ({
  ...DEFAULT_PALETTE,
  ...(PAGE_PALETTES[page] ?? {}),
  ...(overrides ?? {}),
});

// "textMuted" -> "--page-text-muted"
const toVarName = (key) => `--page-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;

// Colors that are applied in a special way instead of as a CSS variable
const SPECIAL_KEYS = ["sides", "sidesBorder"];

export const paletteToCssVars = (palette) => {
  const vars = {};
  for (const [key, value] of Object.entries(palette)) {
    if (SPECIAL_KEYS.includes(key) || value == null) continue;
    vars[toVarName(key)] = value;
  }
  return vars;
};

// Puts a palette on the whole document, so the header bar, the page, popups and the
// sides can all use it with var(--page-...). PageLayout calls this for every page.
export function applyPalette(palette = DEFAULT_PALETTE) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  for (const [name, value] of Object.entries(paletteToCssVars(palette))) {
    root.style.setProperty(name, value);
  }

  // index.css colors titles with --text-h
  root.style.setProperty("--text-h", palette.heading);

  // The page sides and the lines along the page column (index.css: --bg / --border)
  if (palette.sides) root.style.background = palette.sides;
  else root.style.removeProperty("background");

  if (palette.sidesBorder) root.style.setProperty("--border", palette.sidesBorder);
  else root.style.removeProperty("--border");
}

// Colors are ready before the first page is drawn
applyPalette(DEFAULT_PALETTE);

// In JavaScript, inside a component rendered by PageLayout:  const palette = usePalette();
export const PaletteContext = createContext(DEFAULT_PALETTE);
export const usePalette = () => useContext(PaletteContext);
