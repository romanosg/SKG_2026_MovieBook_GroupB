// The ways the movies on the Browse page can be ordered. The first one is the default.
// (Delete a line here to remove that choice from the "Sort by" dropdown.)
export const MOVIE_SORT_OPTIONS = [
  { value: "date", label: "Date" }, //     the movie's year
  { value: "title", label: "Title" }, //   alphabetical
  { value: "rating", label: "Rating" }, // the movie's star rating (star_review)
];

export const MOVIE_ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

// Returns a new list: the movies in the chosen order (ties are sorted by title)
export function sortMovies(movies, sortBy, order) {
  const direction = order === "asc" ? 1 : -1;
  const comparisons = {
    date: (a, b) => a.year - b.year,
    title: (a, b) => a.title.localeCompare(b.title),
    rating: (a, b) => (a.star_review ?? 0) - (b.star_review ?? 0),
  };
  const compare = comparisons[sortBy] ?? comparisons.date;

  return [...movies].sort((a, b) => compare(a, b) * direction || a.title.localeCompare(b.title));
}
