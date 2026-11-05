import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { slugify } from "../utils/slug";
import PageLayout from "../components/PageLayout";
import StarRating from "../components/StarRating";
import ReviewList from "../components/ReviewList";
import Pager from "../components/Pager";
import { request } from "../utils/api";
import { getStats } from "../utils/movieReviews";

// 15 reviews per page
const REVIEWS_PER_PAGE = 15;

// Page bar settings (matching browse and review pages)
const PAGES_BEFORE_CURRENT = 3;
const PAGES_AFTER_CURRENT = 5;
const PAGE_JUMP = 10;

// star path for the interactive picker in the review form
const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

// clickable star for the review form (not the display StarRating component)
function PickerStar({ filled, hovered, onClick, onMouseEnter, onMouseLeave, index }) {
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
  const { id } = useParams(); // the movie's name (or old id) from the address /movies/:id
  const location = useLocation();
  const movieId = location.state?.movieId; // set when we arrive by clicking a movie
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

  // diabazoume ton xristi apo localStorage
  const [loggedUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  });

  // katastasi tis formas review
  const [formRating, setFormRating] = useState(0);
  const [formHover, setFormHover] = useState(null);
  const [formText, setFormText] = useState("");
  const [formPrivate, setFormPrivate] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // ref gia na kanoume refetch ta reviews meta apo submit
  const loadReviewsRef = useRef(null);

  useEffect(() => {
    let cancelled = false; // ignore the answer if we've already left this movie

    const loadMovie = async () => {
      setLoading(true);
      setError("");
      setMovie(null);
      try {
        const isDatabaseId = /^[a-f0-9]{24}$/i.test(id);
        const idToLoad = movieId || (isDatabaseId ? id : null);

        let data;
        if (idToLoad) {
         try {
  data = await request(`/api/movies/${idToLoad}`);
} catch (err) {
  if (err.status === 400 || err.status === 404) {
    throw new Error("not-found");
  }
  throw new Error("failed");
} 
        } else {
          const movies = await request("/api/movies");
          data = movies.find((m) => slugify(m.title) === id.toLowerCase());
          if (!data) throw new Error("not-found");
        }
        if (!cancelled) setMovie(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message === "not-found"
              ? "Movie not found."
              : "Could not load this movie. Is the server running?"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMovie();
    return () => {
      cancelled = true;
    };
  }, [id, movieId]);

  // Check whether the logged-in user has already marked this movie as watched.
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
        const response = await fetch(`/api/watched-movies/movie/${movie._id}`);
        if (!response.ok) throw new Error("Could not check watched status.");
        const entries = await response.json();
        const watched = entries.some((entry) => {
          const entryUserId = entry.user_id?._id || entry.user_id;
          return String(entryUserId) === String(userId);
        });
        if (!cancelled) setIsWatched(watched);
      } catch (err) {
        if (!cancelled) setWatchedError(err.message || "Could not check watched status.");
      } finally {
        if (!cancelled) setWatchedStatusLoading(false);
      }
    };

    loadWatchedStatus();
    return () => { cancelled = true; };
  }, [movie, loggedUser]);

  const handleMarkAsWatched = async () => {
    if (!movie || !loggedUser || watchedSubmitting || isWatched) return;

    setWatchedSubmitting(true);
    setWatchedError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/watched-movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ movie_id: movie._id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not mark this movie as watched.");
      setIsWatched(true);
    } catch (err) {
      setWatchedError(err.message || "Could not connect to the server.");
    } finally {
      setWatchedSubmitting(false);
    }
  };

  // fetch reviews otan fortothei i tenia
  useEffect(() => {
    if (!movie) return;
    let cancelled = false;

    const loadReviews = async () => {
      try {
        const isThisMovie = (r) => String(r.movie_id?._id ?? r.movie_id) === String(movie._id);

        const publicList = await request(`/api/user-reviews/public?movie_id=${movie._id}`);
        const found = publicList.filter(isThisMovie);

        if (loggedUser) {
          try {
            const privateList = await request("/api/user-reviews/private", { auth: true });
            found.push(...privateList.filter(isThisMovie));
          } catch {}
        }

        if (!cancelled) {
          setReviews(found);
          setPage(1); // reset to page 1 on load/reload
        }
      } catch (err) {
        console.error("Could not load the reviews:", err);
      } finally {
        if (!cancelled) setReviewsLoaded(true);
      }
    };

    loadReviewsRef.current = loadReviews;
    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [movie, loggedUser]);

  // apostoli tou review (kai ayto-anathesh stin listawatched movies)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Front-end validation prevents submission and watched assignment if invalid
    if (formRating === 0) {
      setFormError("Please select a star rating.");
      return;
    }
    if (!formText.trim()) {
      setFormError("Please write something in your review.");
      return;
    }

    const token = localStorage.getItem("token");
    setFormSubmitting(true);

    try {
      const res = await fetch("http://localhost:3000/api/user-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movie_id: movie._id,
          rating: formRating,
          text: formText.trim(),
          isPrivate: formPrivate,
        }),
      });

      

      // 2. Automatically assign the movie as watched upon successful review submission
      try {
        await fetch("http://localhost:3000/api/watched-movies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ movie_id: movie._id }),
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
    } catch {
      setFormError("Could not connect to the server.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // The movie's rating and review count are worked out from its public reviews
  const { count: reviewCount, average: averageRating } = getStats(reviews);

  // Pagination slicing for reviews
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const firstIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const pageReviews = reviews.slice(firstIndex, firstIndex + REVIEWS_PER_PAGE);

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
                    disabled={isWatched || watchedStatusLoading || watchedSubmitting}
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
                    <p className="mt-2 text-sm text-danger-text" role="alert">{watchedError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-[260px] flex-1">
              <h1 className="m-0 text-[40px] leading-[1.15] font-bold normal-case">{movie.title}</h1>
              <p className="mt-1.5 text-lg text-muted">{movie.year}</p>

              {movie.genre?.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2 p-0" aria-label="Genres">
                  {movie.genre.map((g) => (
                    <li
                      key={g}
                      className="rounded-full border border-brand px-3.5 py-1 text-[13px] text-brand"
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              )}

              <h2 className="label-brand mt-7 mb-1.5 text-center">Director</h2>
              <p className="m-0 text-center text-base leading-[1.6] whitespace-pre-wrap">
                {movie.director}
              </p>

              <h2 className="label-brand mt-7 mb-1.5 text-left">Description</h2>
              <p className="m-0 text-left text-base leading-[1.6] whitespace-pre-wrap">
                {movie.description}
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                {reviewsLoaded ? (
                  <>
                    <span className="text-base">
                      {reviewCount} public {reviewCount === 1 ? "review" : "reviews"}
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

        {/* forma gia neo review - mono gia sindedemeno xristi */}
        {movie && loggedUser && (
          <div className="mt-10">
            <h2 className="label-brand mb-4 text-left text-lg">Write a review</h2>
            <form
              onSubmit={handleReviewSubmit}
              className="rounded-[10px] bg-surface p-5 flex flex-col gap-4"
            >
              {/* epilogi asteria */}
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

              {/* keimeno review */}
              <label className="field">
                <span className="text-sm font-medium">Review</span>
                <textarea
                  className="input mt-1 min-h-[100px] resize-y"
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  maxLength={2000}
                  placeholder="Write your thoughts about this movie..."
                />
                <span className="text-xs text-muted text-right">{formText.length}/2000</span>
              </label>

              {/* private checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={formPrivate}
                  onChange={(e) => setFormPrivate(e.target.checked)}
                  className="cursor-pointer"
                />
                Keep this review private
              </label>

              {formError && <span className="error">{formError}</span>}
              {formSuccess && <span className="text-success text-sm">Review submitted!</span>}

              <button className="btn" type="submit" disabled={formSubmitting}>
                {formSubmitting ? "Submitting..." : "Submit review"}
              </button>
            </form>
          </div>
        )}

        {/* ola ta public reviews (kai ta dika tou xristi prwta), me filtra kai pager */}
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