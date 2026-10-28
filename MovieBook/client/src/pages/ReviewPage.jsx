import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import StarRating from "../components/StarRating";
import { useLoggedUser } from "../utils/useLoggedUser";
import { slugify } from "../utils/slug";

// Reviews aren't implemented yet, so there are none for now.
// Later this will be loaded from the server. Each review is expected to look like:
// { id, movieId, movieTitle, movieYear, postedAt, rating (0 to 5), text,
//   visibility: "personal" | "public" }
const reviews = [];

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
  movieDate: (a, b) => a.movieYear - b.movieYear,
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

  const reviewsEmail = searchParams.get("email") || loggedUser?.email;

  // Nobody is logged in and no email in the address
  if (!reviewsEmail) {
    return (
      <PageLayout page="reviews">
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

  const isOwn =
    Boolean(loggedUser?.email) &&
    loggedUser.email.toLowerCase() === reviewsEmail.toLowerCase();

  // Personal reviews are only for their author: everyone else sees the public ones
  const activeFilter = isOwn ? filter : "public";

  const direction = order === "asc" ? 1 : -1;
  const visibleReviews = reviews
    .filter((review) => activeFilter === "all" || review.visibility === activeFilter)
    .sort(
      (a, b) =>
        compare[sortBy](a, b) * direction || a.movieTitle.localeCompare(b.movieTitle)
    );

  const heading = isOwn ? "My Reviews" : `${reviewsEmail.split("@")[0]}'s Reviews`;

  return (
    <PageLayout page="reviews">
      <h1 className="mb-5 text-[32px] font-bold [overflow-wrap:anywhere]">{heading}</h1>

      <div className="flex flex-wrap items-center justify-center gap-5">
        {isOwn && (
          <Control
            id="review-filter"
            label="Show"
            value={filter}
            onChange={setFilter}
            options={FILTER_OPTIONS}
          />
        )}
        <Control
          id="review-sort"
          label="Sort by"
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
        />
        <Control
          id="review-order"
          label="Order"
          value={order}
          onChange={setOrder}
          options={ORDER_OPTIONS}
        />
      </div>

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
          {visibleReviews.map((review) => (
            <li
              key={review.id}
              className="rounded-[10px] border border-line bg-surface px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={`/movies/${slugify(review.movieTitle) || review.movieId}`}
                  state={{ movieId: review.movieId }}
                  className="text-lg font-bold"
                >
                  {review.movieTitle}
                </Link>
                <StarRating rating={review.rating} size={24} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-muted">
                <span>Posted {new Date(review.postedAt).toLocaleDateString()}</span>
                <span>Movie year {review.movieYear}</span>
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
    </PageLayout>
  );
}
