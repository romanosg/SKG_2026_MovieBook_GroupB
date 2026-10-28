import React, { useLayoutEffect } from "react";

// The base structure of a page: background, text color and the space around the content.
//
//   <PageLayout page="home">...</PageLayout>
//
// page:        which page this is (home, movie, profile, reviews, signIn, signUp).
//              App.css can give each page its own colors:  html[data-page="profile"] { ... }
// cornerWidth: optional. Space between the page's edges and its content, in pixels:
//              one number for every side, or { x, y } for left/right and top/bottom.
//              Without it the default is 24px.
// className:   extra Tailwind classes for this page, e.g. className="flex"
export default function PageLayout({ page, cornerWidth, className = "", children }) {
  // While the page is open, the whole document knows which page it is
  useLayoutEffect(() => {
    if (!page) return;
    document.documentElement.dataset.page = page;
    return () => {
      delete document.documentElement.dataset.page;
    };
  }, [page]);

  let padding;
  if (typeof cornerWidth === "number") {
    padding = `${cornerWidth}px`;
  } else if (cornerWidth) {
    padding = `${cornerWidth.y ?? 24}px ${cornerWidth.x ?? 24}px`;
  }

  return (
    <main
      className={`box-border w-full flex-1 bg-page p-6 text-main ${className}`}
      style={padding ? { padding } : undefined}
    >
      {children}
    </main>
  );
}
