// The jump size X must be bigger than the number of page buttons shown at once, otherwise a
// jump would land on a page that is already visible. Too small a value is raised.
export const getJumpSize = (pagesBefore, pagesAfter, jumpSize) =>
  Math.max(jumpSize, pagesBefore + 1 + pagesAfter + 1);

// Works out what the page bar shows:
//   items          the page numbers around the current page
//   jumpBack       a page number shown before them (X pages back, or page 1), or null
//   jumpForward    a page number shown after them (X pages ahead, or the last page), or null
//   gapBefore      true when pages are skipped between jumpBack and the numbers ("...")
//   gapAfter       true when pages are skipped between the numbers and jumpForward ("...")
export function getPagerLayout({ page, totalPages, pagesBefore, pagesAfter, jumpSize }) {
  const first = Math.max(1, page - pagesBefore);
  const last = Math.min(totalPages, page + pagesAfter);

  const items = [];
  for (let p = first; p <= last; p++) items.push(p);

  const jumpBackPage = Math.max(1, page - jumpSize);
  const jumpForwardPage = Math.min(totalPages, page + jumpSize);
  const showBack = jumpBackPage < first;
  const showForward = jumpForwardPage > last;

  return {
    items,
    jumpBack: showBack ? jumpBackPage : null,
    jumpForward: showForward ? jumpForwardPage : null,
    gapBefore: showBack && first - jumpBackPage > 1,
    gapAfter: showForward && jumpForwardPage - last > 1,
  };
}
