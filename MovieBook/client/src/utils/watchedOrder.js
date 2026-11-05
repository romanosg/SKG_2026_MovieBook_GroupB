// The ways a user's watched movies can be ordered. The first one is the default.
// Every way puts the "most" first; ties are sorted by the most recently added.
export const WATCHED_SORT_OPTIONS = [
  { value: "recent", label: "Recently added" }, //   when the movie was added to the watched list
  { value: "rating", label: "Most rated" }, //       the user's own star rating
  { value: "comments", label: "Most commented" }, // the longest comment first, movies without one last
];

// Returns a new list in the chosen order
export function sortWatched(list, sortBy) {
  const added = (item) => new Date(item.createdAt ?? item.watchedAt);
  const recency = (a, b) => added(b) - added(a);

  const comparisons = {
    recent: recency,
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    comments: (a, b) => (b.review?.length ?? 0) - (a.review?.length ?? 0),
  };
  const compare = comparisons[sortBy] ?? recency;

  return [...list].sort((a, b) => compare(a, b) || recency(a, b));
}
