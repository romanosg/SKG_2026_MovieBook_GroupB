// The id of the user who wrote a review (the server may send the whole user or just the id)
export const authorId = (review) => String(review.user_id?._id ?? review.user_id);

// Own reviews (public and private) first, then everybody else's public reviews.
// Each group is in the chosen order.
//   sortBy: "recency" | "rating"      order: "desc" | "asc"
export function groupAndSort(reviews, ownId, sortBy, order) {
  const direction = order === "asc" ? 1 : -1;
  const compare = (a, b) => {
    const primary =
      sortBy === "rating"
        ? a.rating - b.rating
        : new Date(a.reviewDate) - new Date(b.reviewDate);
    // ties: the newer review first
    return primary * direction || new Date(b.reviewDate) - new Date(a.reviewDate);
  };

  const own = ownId ? String(ownId) : null;
  const mine = own ? reviews.filter((r) => authorId(r) === own) : [];
  const others = reviews.filter((r) => !r.isPrivate && (!own || authorId(r) !== own));

  return { mine: [...mine].sort(compare), others: [...others].sort(compare) };
}

// The number of public reviews and their average rating (0 when there are none)
export function getStats(reviews) {
  const publicOnes = reviews.filter((r) => !r.isPrivate);
  if (publicOnes.length === 0) return { count: 0, average: 0 };

  const sum = publicOnes.reduce((total, r) => total + r.rating, 0);
  return {
    count: publicOnes.length,
    average: Math.round((sum / publicOnes.length) * 10) / 10,
  };
}
