// Turns a review from the server into the shape the Review page uses
export const toReview = (review) => ({
  id: review._id,
  movieId: review.movie_id?._id ?? null,
  movieTitle: review.movie_id?.title ?? "Unknown movie",
  movieYear: review.movie_id?.year ?? null,
  postedAt: review.reviewDate,
  rating: review.rating,
  text: review.text,
  visibility: review.isPrivate ? "personal" : "public",
});

// Is this public review written by the user we are looking at?
// The server may send the public reviews of every user, or only the asked user's.
// So: if a review says who wrote it, that must be this user; if it doesn't, the server
// has already picked the right ones.
//   email:  the user's email (lowercase)
//   userId: the user's id, when we know it (the logged-in user looking at their own reviews)
export const wroteIt = (review, email, userId) => {
  const author = review.user_id;
  if (userId && author?._id) return String(author._id) === String(userId);
  if (author?.email) return author.email.toLowerCase() === email;
  return true;
};
