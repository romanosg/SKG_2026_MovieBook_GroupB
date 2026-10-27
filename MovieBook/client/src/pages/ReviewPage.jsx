import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import StarRating from "../components/StarRating";
import { useLoggedUser } from "../utils/useLoggedUser";
import { slugify } from "../utils/slug";
import formStyles from "./formStyles";

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

// The colors come from the page's palette (CSS variables set by PageLayout)
const styles = {
  title: { margin: "0 0 20px", fontSize: 32, fontWeight: 700, overflowWrap: "anywhere" },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center", // the filters sit in the middle of the page
    gap: 20,
    alignItems: "center",
  },
  control: { display: "flex", alignItems: "center", gap: 10 },
  controlLabel: {
    color: "var(--page-accent)",
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
    paddingBottom: 2,
    borderBottom: "2px solid var(--page-accent)",
  },
  select: {
    ...formStyles.input,
    width: "auto",
    height: 40,
    padding: "0 12px",
    colorScheme: "dark",
    cursor: "pointer",
  },
  count: { margin: "20px 0 0", color: "var(--page-text-muted)" },
  message: { margin: "16px 0 0", color: "var(--page-text-muted)" },
  list: {
    listStyle: "none",
    margin: "16px 0 0",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    background: "var(--page-surface)",
    border: "1px solid var(--page-border)",
    borderRadius: 10,
    padding: "16px 20px",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  movieLink: {
    color: "inherit",
    fontSize: 18,
    fontWeight: 700,
    textDecoration: "none",
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    margin: "8px 0 0",
    fontSize: 13,
    color: "var(--page-text-muted)",
  },
  chip: {
    border: "1px solid var(--page-accent)",
    color: "var(--page-accent)",
    borderRadius: 999,
    padding: "1px 10px",
    fontSize: 12,
  },
  reviewText: { margin: "12px 0 0", lineHeight: 1.6, whiteSpace: "pre-wrap" },
};

// A label with a dropdown, in the same style as the homepage's Genre dropdown
function Control({ id, label, value, onChange, options }) {
  return (
    <div style={styles.control}>
      <label htmlFor={id} style={styles.controlLabel}>
        {label}
      </label>
      <select
        id={id}
        style={styles.select}
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
        <p style={styles.message}>
          Please{" "}
          <Link to="/sign-in" style={{ color: "var(--page-accent)" }}>
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
      <h1 style={styles.title}>{heading}</h1>

      <div style={styles.controls}>
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

      <p style={styles.count}>
        {visibleReviews.length} {visibleReviews.length === 1 ? "review" : "reviews"}
      </p>

      {visibleReviews.length === 0 && (
        <p style={styles.message}>
          {reviews.length === 0 ? "No reviews yet." : "No reviews match this filter."}
        </p>
      )}

      {visibleReviews.length > 0 && (
        <ul style={styles.list}>
          {visibleReviews.map((review) => (
            <li key={review.id} style={styles.card}>
              <div style={styles.cardTop}>
                <Link
                  to={`/movies/${slugify(review.movieTitle) || review.movieId}`}
                  state={{ movieId: review.movieId }}
                  style={styles.movieLink}
                >
                  {review.movieTitle}
                </Link>
                <StarRating rating={review.rating} size={24} />
              </div>
              <div style={styles.meta}>
                <span>Posted {new Date(review.postedAt).toLocaleDateString()}</span>
                <span>Movie year {review.movieYear}</span>
                <span style={styles.chip}>
                  {review.visibility === "public" ? "Public" : "Personal"}
                </span>
              </div>
              {review.text && <p style={styles.reviewText}>{review.text}</p>}
            </li>
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
