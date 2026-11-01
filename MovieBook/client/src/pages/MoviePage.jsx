import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { slugify } from "../utils/slug";
import PageLayout from "../components/PageLayout";
import StarRating from "../components/StarRating";

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
        // The address holds the movie's name (e.g. "the-dark-knight") or, in old links, an id.
        // When we arrive by clicking a movie in the list, its id is also passed along.
        const isDatabaseId = /^[a-f0-9]{24}$/i.test(id);
        const idToLoad = movieId || (isDatabaseId ? id : null);

        let data;
        if (idToLoad) {
          const response = await fetch(`/api/movies/${idToLoad}`);
          if (response.status === 400 || response.status === 404) {
            throw new Error("not-found");
          }
          if (!response.ok) throw new Error("failed");
          data = await response.json();
        } else {
          // Opened from a typed or shared link: find the movie by its name
          const response = await fetch("/api/movies");
          if (!response.ok) throw new Error("failed");
          const movies = await response.json();
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

  // fetch reviews otan fortothei i tenia
  useEffect(() => {
    if (!movie) return;

    const loadReviews = async () => {
      try {
        // public reviews gia olous
        const pubRes = await fetch("http://localhost:3000/api/user-reviews/public");
        const pubData = pubRes.ok ? await pubRes.json() : [];

        // filtraroume mono gia afti ti tenia
        const publicForMovie = pubData.filter(
          (r) => String(r.movie_id?._id ?? r.movie_id) === String(movie._id)
        );

        let myReviews = [];
        const token = localStorage.getItem("token");

        if (token) {
          // private reviews tou sindedemenos xristi
          const privRes = await fetch("http://localhost:3000/api/user-reviews/private", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const privData = privRes.ok ? await privRes.json() : [];
          myReviews = privData.filter(
            (r) => String(r.movie_id?._id ?? r.movie_id) === String(movie._id)
          );
        }

        // ta reviews tou xristi prota, meta ta upoloipa public
        const myIds = new Set(myReviews.map((r) => r._id));
        const otherPublic = publicForMovie.filter((r) => !myIds.has(r._id));

        setReviews([...myReviews, ...otherPublic]);
      } catch {
        // an apotixei to fetch, apla den deixnoume reviews
      }
    };

    // krataei ref gia na to kaloume kai meta to submit
    loadReviewsRef.current = loadReviews;
    loadReviews();
  }, [movie, loggedUser]);

  // apostoli tou review
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

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message || "Could not submit review.");
        return;
      }

      // epithixia: kanoume reset ti forma kai refresh ta reviews
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

  const publicReviewCount = reviews.filter((r) => !r.isPrivate).length;
  const reviewCount = movie?.reviewCount ?? publicReviewCount;
  const averageRating = movie?.averageRating ?? 0;

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

            <div className="min-w-[260px] flex-1">
              <h1 className="m-0 text-[40px] leading-[1.15] font-bold">{movie.title}</h1>
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
                <span className="text-base">
                  {reviewCount} public {reviewCount === 1 ? "review" : "reviews"}
                </span>
                <StarRating rating={averageRating} size={66} />
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

        {/* section me ta reviews */}
        {movie && reviews.length > 0 && (
          <div className="mt-10">
            <h2 className="label-brand mb-4 text-left text-lg">Reviews</h2>
            <ul className="flex flex-col gap-4 p-0" style={{ listStyle: "none" }}>
              {reviews.map((review) => {
                const isOwn =
                  loggedUser &&
                  String(review.user_id?._id ?? review.user_id) ===
                    String(loggedUser._id ?? loggedUser.id);
                const authorEmail = review.user_id?.email ?? loggedUser?.email ?? "Unknown";
                const date = new Date(review.reviewDate).toLocaleDateString("el-GR");

                return (
                  <li
                    key={review._id}
                    className="rounded-[10px] bg-surface p-4"
                    style={{ borderLeft: isOwn ? "3px solid var(--color-brand)" : "3px solid transparent" }}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm">
                        {isOwn ? "You" : authorEmail}
                      </span>
                      {review.isPrivate && (
                        <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted border border-muted">
                          Private
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted">{date}</span>
                    </div>
                    <StarRating rating={review.rating} size={18} />
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{review.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {movie && reviews.length === 0 && !loading && (
          <p className="mt-8 text-muted text-sm">No reviews yet for this movie.</p>
        )}
      </div>
    </PageLayout>
  );
}
