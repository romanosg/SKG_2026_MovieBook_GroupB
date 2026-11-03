import React, { useEffect, useState } from "react";
import { getJumpSize, getPagerLayout } from "../utils/paging";

// The page bar: First, Previous, page numbers (with jump pages and "..."), Next, Last,
// and a box to type a page number.
//
//   <Pager page={page} totalPages={totalPages} onPageChange={setPage} />
//
// pagesBefore / pagesAfter: how many page numbers to show before and after the current page
// jumpSize:                 also show the page this many pages away (see utils/paging.js)
// Shows nothing when there is only one page.
export default function Pager({
  page,
  totalPages,
  onPageChange,
  pagesBefore = 3,
  pagesAfter = 5,
  jumpSize = 10,
  label = "Pages",
}) {
  const [pageInput, setPageInput] = useState(""); // text in the "go to page" box

  // The box starts empty again when the number of pages changes
  useEffect(() => {
    setPageInput("");
  }, [totalPages]);

  const jump = getJumpSize(pagesBefore, pagesAfter, jumpSize);
  useEffect(() => {
    if (jump !== jumpSize) {
      console.warn(`Page jump (${jumpSize}) must be bigger than the pages shown. Using ${jump}.`);
    }
  }, [jump, jumpSize]);

  if (totalPages <= 1) return null;

  const { items, jumpBack, jumpForward, gapBefore, gapAfter } = getPagerLayout({
    page,
    totalPages,
    pagesBefore,
    pagesAfter,
    jumpSize: jump,
  });

  // "Go to page" box: only valid page numbers (1 to totalPages) can be typed
  const handlePageInputChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits === "") {
      setPageInput("");
      return;
    }
    const number = Number(digits);
    if (number < 1 || number > totalPages) return; // ignore invalid page numbers
    setPageInput(String(number)); // also drops leading zeros
  };

  const handlePageJump = (e) => {
    e.preventDefault();
    if (pageInput === "") return;
    onPageChange(Math.min(Math.max(1, Number(pageInput)), totalPages));
    setPageInput("");
  };

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={label}>
      <button type="button" className="nav-btn" disabled={page === 1} onClick={() => onPageChange(1)}>
        First
      </button>

      <button
        type="button"
        className="nav-btn"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>

      {jumpBack !== null && (
        <>
          <button
            type="button"
            className="num-btn"
            title={`Go to page ${jumpBack}`}
            aria-label={`Go to page ${jumpBack}`}
            onClick={() => onPageChange(jumpBack)}
          >
            {jumpBack}
          </button>
          {/* pages are skipped between the jump page and the shown pages */}
          {gapBefore && (
            <span className="px-1 text-muted" aria-hidden="true">
              ...
            </span>
          )}
        </>
      )}

      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={`num-btn ${item === page ? "num-btn-active" : ""}`}
          aria-current={item === page ? "page" : undefined}
          onClick={() => onPageChange(item)}
        >
          {item}
        </button>
      ))}

      {jumpForward !== null && (
        <>
          {/* pages are skipped between the shown pages and the jump page */}
          {gapAfter && (
            <span className="px-1 text-muted" aria-hidden="true">
              ...
            </span>
          )}
          <button
            type="button"
            className="num-btn"
            title={`Go to page ${jumpForward}`}
            aria-label={`Go to page ${jumpForward}`}
            onClick={() => onPageChange(jumpForward)}
          >
            {jumpForward}
          </button>
        </>
      )}

      <button
        type="button"
        className="nav-btn"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>

      <button
        type="button"
        className="nav-btn"
        disabled={page === totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        Last
      </button>

      <form className="m-0 flex items-center gap-2" onSubmit={handlePageJump}>
        <input
          className="input h-8 w-[72px] px-2 py-0 text-center"
          type="text"
          inputMode="numeric"
          placeholder="Page"
          maxLength={String(totalPages).length}
          aria-label={`Go to page (1 to ${totalPages})`}
          value={pageInput}
          onChange={handlePageInputChange}
        />
        <button type="submit" className="nav-btn" disabled={pageInput === ""}>
          Go
        </button>
      </form>
    </nav>
  );
}
