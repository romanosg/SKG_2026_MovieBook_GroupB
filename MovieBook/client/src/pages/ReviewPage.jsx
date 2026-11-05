import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import Pager from "../components/Pager";
import StarRating from "../components/StarRating";
import StarPicker from "../components/StarPicker";
import { useLoggedUser } from "../utils/useLoggedUser";
import { slugify } from "../utils/slug";
import { request, clearLogin } from "../utils/api";
import { toReview, wroteIt } from "../utils/reviews";

const REVIEWS_PER_PAGE = 30;

const PAGES_BEFORE_CURRENT = 3;
const PAGES_AFTER_CURRENT = 5;
const PAGE_JUMP = 10;
const TEXT_MAX_LENGTH = 2000;

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "personal", label: "Personal" },
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

const compare = {
  postDate: (a, b) => new Date(a.postedAt) - new Date(b.postedAt),
  movieDate: (a, b) => (a.movieYear ?? 0) - (b.movieYear ?? 0),
  rating: (a, b) => a.rating - b.rating,
};

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

function ReviewCardItem({ review, isOwn, onChanged }) {
  const [mode, setMode] = useState("view");
  const [text, setText] = useState(review.text);
  const [rating, setRating] = useState(review.rating);
  const [isPrivate, setIsPrivate] = useState(review.visibility === "personal" || review.isPrivate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const date = new Date(review.postedAt || review.reviewDate).toLocaleDateString("el-GR");
  
  // Robust check for edited status across raw data and view objects
  const rawData = review.raw || review;
  const createdAt = rawData.createdAt || review.createdAt;
  const updatedAt = rawData.updatedAt || review.updatedAt;
  
  const isEdited =
    Boolean(rawData.isEdited) ||
    Boolean(review.isEdited) ||
    (updatedAt && createdAt && new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000);

  const messageFor = (err, fallback) =>
    err.status === 401 ? "Your session expired. Please sign in again." : err.message || fallback;

  const startEdit = () => {
    setText(review.text);
    setRating(review.rating);
    setIsPrivate(review.visibility === "personal" || review.isPrivate);
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
      await request(`/api/user-reviews/${review.id || review._id}`, {
        method: "PUT",
        auth: true,
        body: { text: text.trim(), rating, isPrivate },
      });
      setMode("view");
      onChanged?.();
    } catch (err) {
      setError(messageFor(err, "Could not save the review."));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setError("");
    setBusy(true);
    try {
      await request(`/api/user-reviews/${review.id || review._id}`, { method: "DELETE", auth: true });
      onChanged?.();
    } catch (err) {
      setError(messageFor(err, "Could not delete the review."));
      setMode("view");
    } finally {
      setBusy(false);
    }
  };

  const isPersonal = review.visibility === "personal" || review.isPrivate;

  return (
    <li
      className={`rounded-[10px] border px-5 py-4 ${
        isOwn ? "border-line border-l-[3px] border-l-brand bg-surface-light" : "border-line bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {review.movieId ? (
          <Link
            to={`/movies/${slugify(review.movieTitle) || review.movieId}`}
            state={{ movieId: review.movieId }}
            className="text-lg font-bold hover:underline"
          >
            {review.movieTitle}
          </Link>
        ) : (
          <span className="text-lg font-bold text-muted">{review.movieTitle}</span>
        )}
        <StarRating rating={mode === "edit" ? rating : review.rating} size={24} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-muted">
        {isEdited && <span className="italic">(edited)</span>}
        <span>Posted {date}</span>
        {review.movieYear !== null && <span>Movie year {review.movieYear}</span>}
        <span
          className={`rounded-full border px-2.5 py-px text-xs ${
            isPersonal ? "border-success text-success" : "border-brand text-brand"
          }`}
        >
          {isPersonal ? "Personal" : "Public"}
        </span>
      </div>

      {mode !== "edit" && review.text && (
        <p className="mt-3 leading-relaxed whitespace-pre-wrap">{review.text}</p>
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

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const loggedUser = useLoggedUser();

  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("postDate");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [displayUsername, setDisplayUsername] = useState("");

  const emailParam = searchParams.get("email");
  const usernameParam = searchParams.get("username");

  const loggedEmail = (loggedUser?.email || "").trim().toLowerCase();
  const loggedUsername = (loggedUser?.username || "").trim().toLowerCase();
  const paramEmail = (emailParam || "").trim().toLowerCase();
  const paramUsername = (usernameParam || "").trim().toLowerCase();

  const isOwn =
    Boolean(loggedUser) &&
    ((paramEmail && loggedEmail === paramEmail) ||
     (paramUsername && loggedUsername === paramUsername) ||
     (!emailParam && !usernameParam));

  const loadReviewsData = async () => {
    setLoading(true);
    setError("");

    try {
      let targetEmail = "";
      let targetUsername = "";

      if (emailParam) {
        targetEmail = emailParam.trim().toLowerCase();
        try {
          const info = await request(`/api/user/user-info?email=${encodeURIComponent(targetEmail)}`);
          targetUsername = info.user?.username || "";
        } catch {}
      } else if (usernameParam) {
        targetUsername = usernameParam.trim();
        try {
          const info = await request(`/api/user/user-info?username=${encodeURIComponent(targetUsername)}`);
          targetEmail = (info.user?.email || "").toLowerCase();
          targetUsername = info.user?.username || targetUsername;
        } catch {
          setError("User not found.");
          setLoading(false);
          return;
        }
      } else if (loggedUser?.email) {
        targetEmail = loggedUser.email.trim().toLowerCase();
        targetUsername = loggedUser.username || "";
      } else {
        setLoading(false);
        return;
      }

      setDisplayUsername(targetUsername);

      const ownId = isOwn ? (loggedUser.id || loggedUser._id) : null;

      const [publicList, personalList] = await Promise.all([
        request(`/api/user-reviews/public?username=${encodeURIComponent(targetUsername)}`),
        isOwn ? request("/api/user-reviews/private", { auth: true }) : Promise.resolve([]),
      ]);

      const all = [
        ...publicList.filter((review) => wroteIt(review, targetEmail, ownId)),
        ...personalList,
      ].map((rawReview) => {
        const transformed = toReview(rawReview);
        return { ...transformed, raw: rawReview };
      });

      setReviews(all);
    } catch (err) {
      if (err.status === 401) {
        clearLogin();
        setSessionExpired(true);
      } else {
        console.error("Could not load the reviews:", err);
        setError("Could not load reviews. Is the server running?");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, [emailParam, usernameParam, loggedUser?.email, isOwn]);

  const sessionBanner = sessionExpired && (
    <p className="mb-4 text-danger-text">
      Your session expired. Please{" "}
      <Link to="/sign-in" className="underline">
        sign in
      </Link>{" "}
      again.
    </p>
  );

  if (!emailParam && !usernameParam && !loggedUser?.email) {
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

  const activeFilter = isOwn ? filter : "public";

  const direction = order === "asc" ? 1 : -1;
  const visibleReviews = reviews
    .filter((review) => activeFilter === "all" || review.visibility === activeFilter)
    .sort(
      (a, b) =>
        compare[sortBy](a, b) * direction || a.movieTitle.localeCompare(b.movieTitle)
    );

  const totalPages = Math.ceil(visibleReviews.length / REVIEWS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const firstIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const pageReviews = visibleReviews.slice(firstIndex, firstIndex + REVIEWS_PER_PAGE);

  const heading = isOwn ? "My Reviews" : displayUsername ? `${displayUsername}'s Reviews` : "Reviews";

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
                <ReviewCardItem
                  key={review.id || review._id}
                  review={review}
                  isOwn={isOwn}
                  onChanged={loadReviewsData}
                />
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