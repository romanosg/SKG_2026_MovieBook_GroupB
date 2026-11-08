
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { slugify } from "../utils/slug";
import PageLayout from "../components/PageLayout";
import StarRating from "../components/StarRating";
import ReviewList from "../components/ReviewList";
import Pager from "../components/Pager";
import { request } from "../utils/api";
import { getStats } from "../utils/movieReviews";
import { movieCache } from "../utils/movieCache";

// 15 reviews per page
const REVIEWS_PER_PAGE = 15;

// Page bar settings
const PAGES_BEFORE_CURRENT = 3;
const PAGES_AFTER_CURRENT = 5;
const PAGE_JUMP = 10;

// Star path for the interactive picker
const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function PickerStar({
  filled,
  hovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  index,
}) {
  const active = hovered != null ? index < hovered : index < filled;

  return (
    <button
      type="button"
      aria-label={`Rate ${index + 1} out of 5`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="cursor-pointer border-none bg-transparent p-0"
    >
      <svg width={28} height={28} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d={STAR_PATH}
          className={active ? "fill-star" : "fill-line"}
        />
      </svg>
    </button>
  );
}

export default function MoviePage() {
  const { id } = useParams();
  const location = useLocation();
  const movieId = location.state?.movieId;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  const [isWatched, setIsWatched] = useState(false);
  const [watchedStatusLoading, setWatchedStatusLoading] = useState(false);
  const [watchedSubmitting, setWatchedSubmitting] = useState(false);
  const [watchedError, setWatchedError] = useState("");

  const [page, setPage] = useState(1);

  const [loggedUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  // Review form state
  const [formRating, setFormRating] = useState(0);
  const [formHover, setFormHover] = useState(null);
  const [formText, setFormText] = useState("");
  const [formPrivate, setFormPrivate] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const loadReviewsRef = useRef(null);

  // Load movie from cache first, then refresh from the server.
  useEffect(() => {
    let cancelled = false;

    const loadMovie = async () => {
      setError("");

      const isDatabaseId = /^[a-f0-9]{24}$/i.test(id);
      const idToLoad = movieId || (isDatabaseId ? id : null);

      const cachedLists = [
        movieCache.get("/api/movies"),
        movieCache.get("/api/movies/featured"),
        movieCache.get("/api/movies/reviewed"),
      ].filter(Array.isArray);

      let cachedMovie = null;

      for (const list of cachedLists) {
        cachedMovie = list.find((item) =>
          idToLoad
            ? String(item._id) === String(idToLoad)
            : slugify(item.title) === id.toLowerCase()
        );

        if (cachedMovie) break;
      }

      if (cachedMovie) {
        setMovie(cachedMovie);
        setLoading(false);
      } else {
        setMovie(null);
        setLoading(true);
      }

      try {
        let freshMovie;

        if (idToLoad) {
          freshMovie = await request(`/api/movies/${idToLoad}`);
        } else {
          const movies = await request("/api/movies");

          freshMovie = movies.find(
            (item) => slugify(item.title) === id.toLowerCase()
          );
        }

        if (!freshMovie) {
          throw new Error("not-found");
        }

        if (!cancelled) {
          setMovie(freshMovie);
        }
      } catch (err) {
        if (!cancelled && !cachedMovie) {
          setError(
            err.message === "not-found" ||
              err.status === 404 ||
              err.status === 400
              ? "Movie not found."
              : "Could not load this movie. Is the server running?"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMovie();

    return () => {
      cancelled = true;
    };
  }, [id, movieId]);

  // Check whether the logged-in user has watched this movie.
  useEffect(() => {
    if (!movie || !loggedUser) {
      setIsWatched(false);
      setWatchedError("");
      return;
    }

    let cancelled = false;

    const userId = loggedUser._id || loggedUser.id || loggedUser.userId;

    const loadWatchedStatus = async () => {
      setWatchedStatusLoading(true);
      setWatchedError("");

      try {
        const entries = await request(
          `/api/watched-movies/movie/${movie._id}`
        );

        const watched = entries.some((entry) => {
          const entryUserId = entry.user_id?._id || entry.user_id;
          return String(entryUserId) === String(userId);
        });

        if (!cancelled) {
          setIsWatched(watched);
        }
      } catch (err) {
        if (!cancelled) {
          setWatchedError(
            err.message || "Could not check watched status."
          );
        }
      } finally {
        if (!cancelled) {
          setWatchedStatusLoading(false);
        }
      }
    };

    loadWatchedStatus();

    return () => {
      cancelled = true;
    };
  }, [movie, loggedUser]);

  // Mark movie as watched.
  const handleMarkAsWatched = async () => {
    if (!movie || !loggedUser || watchedSubmitting || isWatched) return;

    setWatchedSubmitting(true);
    setWatchedError("");

    try {
      await request("/api/watched-movies", {
        method: "POST",
        body: { movie_id: movie._id },
        auth: true,
      });

      setIsWatched(true);
    } catch (err) {
      setWatchedError(
        err.message || "Could not connect to the server."
      );
    } finally {
      setWatchedSubmitting(false);
    }
  };

  // Load public and private reviews in parallel.
  useEffect(() => {
    if (!movie) return;

    let cancelled = false;

    const loadReviews = async () => {
      try {
        const isThisMovie = (review) =>
          String(review.movie_id?._id ?? review.movie_id) ===
          String(movie._id);

        const publicPromise = request(
          `/api/user-reviews/public?movie_id=${movie._id}`
        );

        const privatePromise = loggedUser
          ? request("/api/user-reviews/private", { auth: true }).catch(
              (err) => {
                console.warn("Could not load private reviews:", err);
                return [];
              }
            )
          : Promise.resolve([]);

        const [publicList, privateList] = await Promise.all([
          publicPromise,
          privatePromise,
        ]);

        const found = [
          ...publicList.filter(isThisMovie),
          ...privateList.filter(isThisMovie),
        ];

        if (!cancelled) {
          setReviews(found);
          setPage(1);
        }
      } catch (err) {
        console.error("Could not load the reviews:", err);
      } finally {
        if (!cancelled) {
          setReviewsLoaded(true);
        }
      }
    };

    loadReviewsRef.current = loadReviews;
    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [movie, loggedUser]);

  // Submit review and automatically mark movie as watched.
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (formRating === 0) {
      setFormError("Please select a star rating.");
      return;
    }

    if (!formText.trim()) {
      setFormError("Please write something in your review.");
      return;
    }

    setFormSubmitting(true);

    try {
      await request("/api/user-reviews", {
        method: "POST",
        body: {
          movie_id: movie._id,
          rating: formRating,
          text: formText.trim(),
          isPrivate: formPrivate,
        },
        auth: true,
      });

      // Automatically assign the movie as watched.
      try {
        await request("/api/watched-movies", {
          method: "POST",
          body: { movie_id: movie._id },
          auth: true,
        });

        setIsWatched(true);
      } catch (watchedErr) {
        console.warn("Auto watched assignment notice:", watchedErr);
      }

      setFormRating(0);
      setFormText("");
      setFormPrivate(false);
      setFormSuccess(true);

      setTimeout(() => setFormSuccess(false), 3000);

      loadReviewsRef.current?.();
    } catch (err) {
      setFormError(err.message || "Could not connect to the server.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Calculate public review statistics.
  const { count: reviewCount, average: averageRating } = getStats(reviews);

  // Reviews pagination.
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const firstIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const pageReviews = reviews.slice(
    firstIndex,
    firstIndex + REVIEWS_PER_PAGE
  );

  return (
    <PageLayout page="movie">
      <div className="mx-auto max-w-[1000px]">
        <Link to="/" className="mb-6 inline-block text-sm text-brand">
          ← Back to movies
        </Link>

        {loading && <p className="text-muted">Loading movie...</p>}
        {error && <p className="text-danger-text">{error}</p>}

        {movie && (
          <div className="flex flex-wrap items-start gap-8">
            <div className="w-[min(100%,320px)] shrink-0">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={`${movie.title} poster`}
                  className="block h-auto w-[min(100%,320px)] rounded-[10px] bg-surface"
                />
              ) : (
                <div className="flex aspect-[2/3] w-[min(100%,320px)] items-center justify-center rounded-[10px] bg-surface text-muted">
                  No image
                </div>
              )}

              {loggedUser && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleMarkAsWatched}
                    disabled={
                      isWatched ||
                      watchedStatusLoading ||
                      watchedSubmitting
                    }
                    className="btn w-full"
                  >
                    {watchedStatusLoading
                      ? "Checking..."
                      : watchedSubmitting
                        ? "Saving..."
                        : isWatched
                          ? "Watched ✓"
                          : "Mark as watched"}
                  </button>

                  {watchedError && (
                    <p
                      className="mt-2 text-sm text-danger-text"
                      role="alert"
                    >
                      {watchedError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-[260px] flex-1">
              <h1 className="m-0 text-[40px] leading-[1.15] font-bold normal-case">
                {movie.title}
              </h1>

              <p className="mt-1.5 text-lg text-muted">{movie.year}</p>

              {movie.genre?.length > 0 && (
                <ul
                  className="mt-5 flex flex-wrap gap-2 p-0"
                  aria-label="Genres"
                >
                  {movie.genre.map((genre) => (
                    <li
                      key={genre}
                      className="rounded-full border border-brand px-3.5 py-1 text-[13px] text-brand"
                    >
                      {genre}
                    </li>
                  ))}
                </ul>
              )}

              <h2 className="label-brand mt-7 mb-1.5 text-center">
                Director
              </h2>

              <p className="m-0 text-center text-base leading-[1.6] whitespace-pre-wrap">
                {movie.director}
              </p>

              <h2 className="label-brand mt-7 mb-1.5 text-left">
                Description
              </h2>

              <p className="m-0 text-left text-base leading-[1.6] whitespace-pre-wrap">
                {movie.description}
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                {reviewsLoaded ? (
                  <>
                    <span className="text-base">
                      {reviewCount} public{" "}
                      {reviewCount === 1 ? "review" : "reviews"}
                    </span>

                    <StarRating rating={averageRating} size={66} />
                  </>
                ) : (
                  <span className="text-muted">Loading reviews...</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review section */}
        {movie && (
          <div className="mt-10">
            {loggedUser ? (
              <>
                <h2 className="label-brand mb-4 text-left text-lg">
                  Write a review
                </h2>

                <form
                  onSubmit={handleReviewSubmit}
                  className="rounded-[10px] bg-surface p-5 flex flex-col gap-4"
                >
                  <div className="field">
                    <span className="text-sm font-medium">Rating</span>

                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <PickerStar
                          key={star}
                          index={star - 1}
                          filled={formRating}
                          hovered={formHover}
                          onClick={() => setFormRating(star)}
                          onMouseEnter={() => setFormHover(star)}
                          onMouseLeave={() => setFormHover(null)}
                        />
                      ))}
                    </div>
                  </div>

                  <label className="field">
                    <span className="text-sm font-medium">Review</span>

                    <textarea
                      className="input mt-1 min-h-[100px] resize-y"
                      value={formText}
                      onChange={(e) => setFormText(e.target.value)}
                      maxLength={2000}
                      placeholder="Write your thoughts about this movie..."
                    />

                    <span className="text-xs text-muted text-right">
                      {formText.length}/2000
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formPrivate}
                      onChange={(e) => setFormPrivate(e.target.checked)}
                      className="cursor-pointer"
                    />
                    Keep this review private
                  </label>

                  {formError && (
                    <span className="error">{formError}</span>
                  )}

                  {formSuccess && (
                    <span className="text-success text-sm">
                      Review submitted!
                    </span>
                  )}

                  <button
                    className="btn"
                    type="submit"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? "Submitting..." : "Submit review"}
                  </button>
                </form>
              </>
            ) : (
              <div className="rounded-[10px] border border-line bg-surface p-6 text-center shadow-sm">
                <h2 className="text-base font-bold mb-2">
                  Want to share your thoughts?
                </h2>

                <p className="text-sm text-muted">
                  You must be signed in to post a review and rate this movie.
                </p>

                <Link
                  to="/sign-in"
                  className="btn mt-4 inline-block px-5 py-2"
                >
                  Sign in to review
                </Link>
              </div>
            )}
          </div>
        )}

        {movie && (
          <>
            <ReviewList
              reviews={pageReviews}
              loggedUser={loggedUser}
              loading={!reviewsLoaded}
              onChanged={() => loadReviewsRef.current?.()}
            />

            <Pager
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              pagesBefore={PAGES_BEFORE_CURRENT}
              pagesAfter={PAGES_AFTER_CURRENT}
              jumpSize={PAGE_JUMP}
              label="Movie review pages"
            />
          </>
        )}
      </div>
    </PageLayout>
  );
}
