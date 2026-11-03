import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import Pager from "../components/Pager";
import StarRating from "../components/StarRating";
import { useLoggedUser } from "../utils/useLoggedUser";
import { slugify } from "../utils/slug";
import { request, clearLogin } from "../utils/api";
import { toReview, wroteIt } from "../utils/reviews";

// Maximum number of reviews shown on one page (change this to show more or fewer)
const REVIEWS_PER_PAGE = 5;

// Page bar settings (the same ones the homepage uses):
// how many page numbers to show before and after the current page, and the jump size
const PAGES_BEFORE_CURRENT = 3;
const PAGES_AFTER_CURRENT = 5;
const PAGE_JUMP = 10;

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "personal", label: "Personal" },
  { value: "public", label: "Public" },
];

const SORT_OPTIONS = [
  { value: "postDate", label: "Post date" },
  { value: "movieDate", label: "Movie date" },
  { value: "rating", label: "Star rating" },
];

const ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

// Ascending comparisons for each way of sorting
const compare = {
  postDate: (a, b) => new Date(a.postedAt) - new Date(b.postedAt),
  movieDate: (a, b) => (a.movieYear ?? 0) - (b.movieYear ?? 0),
  rating: (a, b) => a.rating - b.rating,
};

// A label with a dropdown, in the same style as the homepage's Genre dropdown
function Control({ id, label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor={id} className="label-brand border-b-2 border-brand pb-0.5">
        {label}
      </label>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Shows the reviews of /reviews?email=someone@example.com
// Without an email it shows the logged-in user's own reviews.
export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const loggedUser = useLoggedUser();

  const [filter, setFilter] = useState("all"); // all / personal / public
  const [sortBy, setSortBy] = useState("postDate"); // postDate / movieDate / rating
  const [order, setOrder] = useState("desc"); // desc / asc
  const [page, setPage] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [username, setUsername] = useState("");

  const reviewsEmail = searchParams.get("email") || loggedUser?.email;

  const isOwn =
    Boolean(loggedUser?.email) &&
    Boolean(reviewsEmail) &&
    loggedUser.email.toLowerCase() === reviewsEmail.toLowerCase();
  const ownId = isOwn ? loggedUser.id : null;

  // Load this user's reviews: their public ones, and (only for the owner) their personal ones
  useEffect(() => {
    if (!reviewsEmail) return;
    let cancelled = false;

    setLoading(true);
    setError("");

    const loadReviews = async () => {
      try {
        const target = reviewsEmail.trim().toLowerCase();
        const [publicList, personalList] = await Promise.all([
          request(`/api/user-reviews/public?email=${encodeURIComponent(target)}`),
          isOwn ? request("/api/user-reviews/private", { auth: true }) : Promise.resolve([]),
        ]);

        const all = [
          ...publicList.filter((review) => wroteIt(review, target, ownId)),
          ...personalList,
        ].map(toReview);

        if (!cancelled) {
          setReviews(all);
          setPage(1); // new reviews start on the first page
        }
      } catch (err) {
        if (cancelled) return;
        if (isOwn && err.status === 401) {
          clearLogin(); // the login expired: the page reloads as a visitor
          setSessionExpired(true);
        } else {
          console.error("Could not load the reviews:", err);
          setError("Could not load reviews. Is the server running?");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [reviewsEmail, isOwn, ownId]);

  // The name for the heading of someone else's reviews (their username, never their email)
  useEffect(() => {
    setUsername("");
    if (!reviewsEmail || isOwn) return;
    let cancelled = false;

    request(`/api/user/user-info?email=${encodeURIComponent(reviewsEmail)}`)
      .then((data) => {
        if (!cancelled) setUsername(data.user?.username || "");
      })
      .catch(() => {}); // without a name the heading just says "Reviews"

    return () => {
      cancelled = true;
    };
  }, [reviewsEmail, isOwn]);

  const sessionBanner = sessionExpired && (
    <p className="mb-4 text-danger-text">
      Your session expired. Please{" "}
      <Link to="/sign-in" className="underline">
        sign in
      </Link>{" "}
      again.
    </p>
  );

  // Nobody is logged in and no email in the address
  if (!reviewsEmail) {
    return (
      <PageLayout page="reviews">
        {sessionBanner}
        <p className="mt-4 text-muted">
          Please{" "}
          <Link to="/sign-in" className="text-brand">
            sign in
          </Link>{" "}
          to see your reviews.
        </p>
      </PageLayout>
    );
  }

  // Personal reviews are only for their author: everyone else sees the public ones
  const activeFilter = isOwn ? filter : "public";

  // The reviews that match the filter, in the chosen order
  const direction = order === "asc" ? 1 : -1;
  const visibleReviews = reviews
    .filter((review) => activeFilter === "all" || review.visibility === activeFilter)
    .sort(
      (a, b) =>
        compare[sortBy](a, b) * direction || a.movieTitle.localeCompare(b.movieTitle)
    );

  // Only the reviews of the current page
  const totalPages = Math.ceil(visibleReviews.length / REVIEWS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const firstIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const pageReviews = visibleReviews.slice(firstIndex, firstIndex + REVIEWS_PER_PAGE);

  const heading = isOwn ? "My Reviews" : username ? `${username}'s Reviews` : "Reviews";

  return (
    <PageLayout page="reviews">
      {sessionBanner}
      <h1 className="mb-5 text-[32px] font-bold [overflow-wrap:anywhere]">{heading}</h1>

      <div className="flex flex-wrap items-center justify-center gap-5">
        {isOwn && (
          <Control
            id="review-filter"
            label="Show"
            value={filter}
            onChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
            options={FILTER_OPTIONS}
          />
        )}
        <Control
          id="review-sort"
          label="Sort by"
          value={sortBy}
          onChange={(value) => {
            setSortBy(value);
            setPage(1);
          }}
          options={SORT_OPTIONS}
        />
        <Control
          id="review-order"
          label="Order"
          value={order}
          onChange={(value) => {
            setOrder(value);
            setPage(1);
          }}
          options={ORDER_OPTIONS}
        />
      </div>

      {loading && <p className="mt-5 text-muted">Loading reviews...</p>}
      {error && <p className="mt-5 text-danger-text">{error}</p>}

      {!loading && !error && (
        <>
          <p className="mt-5 text-muted">
            {visibleReviews.length} {visibleReviews.length === 1 ? "review" : "reviews"}
          </p>

          {visibleReviews.length === 0 && (
            <p className="mt-4 text-muted">
              {reviews.length === 0 ? "No reviews yet." : "No reviews match this filter."}
            </p>
          )}

          {visibleReviews.length > 0 && (
            <ul className="mt-4 flex flex-col gap-4 p-0">
              {pageReviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-[10px] border border-line bg-surface px-5 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {review.movieId ? (
                      <Link
                        to={`/movies/${slugify(review.movieTitle) || review.movieId}`}
                        state={{ movieId: review.movieId }}
                        className="text-lg font-bold"
                      >
                        {review.movieTitle}
                      </Link>
                    ) : (
                      <span className="text-lg font-bold text-muted">{review.movieTitle}</span>
                    )}
                    <StarRating rating={review.rating} size={24} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-muted">
                    <span>Posted {new Date(review.postedAt).toLocaleDateString()}</span>
                    {review.movieYear !== null && <span>Movie year {review.movieYear}</span>}
                    <span className="rounded-full border border-brand px-2.5 py-px text-xs text-brand">
                      {review.visibility === "public" ? "Public" : "Personal"}
                    </span>
                  </div>
                  {review.text && (
                    <p className="mt-3 leading-relaxed whitespace-pre-wrap">{review.text}</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <Pager
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            pagesBefore={PAGES_BEFORE_CURRENT}
            pagesAfter={PAGES_AFTER_CURRENT}
            jumpSize={PAGE_JUMP}
            label="Review pages"
          />
        </>
      )}
    </PageLayout>
  );
}
