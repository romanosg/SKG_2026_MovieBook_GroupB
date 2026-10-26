import { createContext, useContext } from "react";

// The colors the site already uses
export const DEFAULT_PALETTE = {
  background: "#121212", // page background
  text: "#e8e8e8", // main text
  accent: "#8ab4f8", // links, buttons, highlights
  surface: "#242424", // cards and panels
  border: "#4a4a4a", // outlines
};

// Space between the page's edges and its content, in pixels
export const DEFAULT_CORNER_WIDTH = 24;

export const PaletteContext = createContext(DEFAULT_PALETTE);

// In any component inside a PageLayout:  const palette = usePalette();
export const usePalette = () => useContext(PaletteContext);
