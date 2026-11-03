import React, { useState } from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import StarPicker from "./StarPicker";
import { request } from "../utils/api";
import { authorId, groupAndSort } from "../utils/movieReviews";

const TEXT_MAX_LENGTH = 2000; // the server refuses a longer review

const SORT_OPTIONS = [
  { value: "recency", label: "Recency" },
  { value: "rating", label: "Rating" },
];

const ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

// A label with a dropdown, in the same style as the other filters of the site
function Control({ id, label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor={id} className="label-brand border-b-2 border-brand pb-0.5">
        {label}
      </label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// One review. The user's own reviews also get Edit and Delete, and say if they are public or private.
function ReviewCard({ review, isOwn, onChanged }) {
  const [mode, setMode] = useState("view"); // "view" | "edit" | "confirm" (asking before deleting)
  const [text, setText] = useState(review.text);
  const [rating, setRating] = useState(review.rating);
  const [isPrivate, setIsPrivate] = useState(review.isPrivate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const author = review.user_id?.username;
  const date = new Date(review.reviewDate).toLocaleDateString("el-GR");

  const messageFor = (err, fallback) =>
    err.status === 401 ? "Your session expired. Please sign in again." : err.message || fallback;

  const startEdit = () => {
    setText(review.text);
    setRating(review.rating);
    setIsPrivate(review.isPrivate);
    setError("");
    setMode("edit");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!text.trim()) {
      setError("Please write something in your review.");
      return;
    }

    setBusy(true);
    try {
      await request(`/api/user-reviews/${review._id}`, {
        method: "PUT",
        auth: true,
        body: { text: text.trim(), rating, isPrivate },
      });
      setMode("view");
      onChanged?.(); // reload the reviews
    } catch (err) {
      // e.g. 409: a review of the other type (public / private) already exists
      setError(messageFor(err, "Could not save the review."));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setError("");
    setBusy(true);
    try {
      await request(`/api/user-reviews/${review._id}`, { method: "DELETE", auth: true });
      onChanged?.(); // reload the reviews
    } catch (err) {
      setError(messageFor(err, "Could not delete the review."));
      setMode("view");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className={`rounded-[10px] border px-5 py-4 ${
        isOwn ? "border-line border-l-[3px] border-l-brand bg-surface-light" : "border-line bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {isOwn ? (
          <Link to="/profile" className="text-sm font-semibold hover:underline">
            You
          </Link>
        ) : author ? (
          <Link
            to={`/profile?username=${encodeURIComponent(author)}`}
            className="text-sm font-semibold hover:underline"
          >
            {author}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-muted">Unknown user</span>
        )}

        {isOwn && (
          <span
            className={`rounded-full border px-2.5 py-px text-xs ${
              review.isPrivate ? "border-line text-muted" : "border-brand text-brand"
            }`}
          >
            {review.isPrivate ? "Private" : "Public"}
          </span>
        )}

        <span className="ml-auto text-xs text-muted">{date}</span>
      </div>

      {mode !== "edit" && (
        <>
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={review.rating} size={20} />
            <span className="text-sm text-muted">{review.rating} / 5</span>
          </div>
          {review.text && (
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{review.text}</p>
          )}
        </>
      )}

      {isOwn && mode === "view" && (
        <div className="mt-3 flex justify-end gap-4 text-sm">
          <button type="button" className="cursor-pointer text-brand hover:underline" onClick={startEdit}>
            Edit
          </button>
          <button
            type="button"
            className="cursor-pointer text-danger hover:underline"
            onClick={() => {
              setError("");
              setMode("confirm");
            }}
          >
            Delete
          </button>
        </div>
      )}

      {isOwn && mode === "confirm" && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3 text-sm">
          <span>Delete this review?</span>
          <button
            type="button"
            className="btn btn-danger px-3 py-1"
            disabled={busy}
            onClick={confirmDelete}
          >
            {busy ? "Deleting..." : "Yes"}
          </button>
          <button
            type="button"
            className="btn px-3 py-1"
            disabled={busy}
            onClick={() => setMode("view")}
          >
            No
          </button>
        </div>
      )}

      {isOwn && mode === "edit" && (
        <form className="mt-3 flex flex-col gap-3" onSubmit={saveEdit} noValidate>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            className="input block min-h-[100px] w-full resize-y leading-normal"
            maxLength={TEXT_MAX_LENGTH}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-brand"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Keep this review private
          </label>
          <div className="flex items-center gap-4">
            <button type="submit" className="btn py-1.5" disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="cursor-pointer text-sm text-muted hover:underline"
              disabled={busy}
              onClick={() => setMode("view")}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="error mt-2">{error}</p>}
    </li>
  );
}

// All the public reviews of a movie. A logged-in user's own reviews (public and private) come first.
//
//   reviews:    the reviews as the server sends them (public ones, plus the user's private ones)
//   loggedUser: the logged-in user, or null
//   loading:    true until the reviews have been loaded
//   onChanged:  called after a review was edited or deleted (reload the reviews)
export default function ReviewList({ reviews, loggedUser, loading = false, onChanged }) {
  const [sortBy, setSortBy] = useState("recency"); // recency | rating
  const [order, setOrder] = useState("desc"); // desc | asc

  const ownId = loggedUser ? String(loggedUser.id ?? loggedUser._id) : null;
  const { mine, others } = groupAndSort(reviews, ownId, sortBy, order);
  const shown = [...mine, ...others];

  return (
    <section className="mt-10 border-t border-line-soft pt-8">
      <h2 className="label-brand mb-4 text-left text-lg">Reviews</h2>

      {loading && <p className="text-sm text-muted">Loading reviews...</p>}

      {!loading && shown.length === 0 && (
        <p className="text-sm text-muted">No reviews yet for this movie.</p>
      )}

      {!loading && shown.length > 0 && (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-center gap-5">
            <Control
              id="movie-review-sort"
              label="Sort by"
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
            />
            <Control
              id="movie-review-order"
              label="Order"
              value={order}
              onChange={setOrder}
              options={ORDER_OPTIONS}
            />
          </div>

          <ul className="flex flex-col gap-4 p-0">
            {shown.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                isOwn={ownId !== null && authorId(review) === ownId}
                onChanged={onChanged}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
