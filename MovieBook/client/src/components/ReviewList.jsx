import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import StarPicker from "./StarPicker";
import { request } from "../utils/api";
import { authorId, groupAndSort } from "../utils/movieReviews";

const TEXT_MAX_LENGTH = 2000;

const SORT_OPTIONS = [
  { value: "recency", label: "Recency" },
  { value: "rating", label: "Rating" },
];

const ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

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

function CommentItem({ comment, ownId, onCommentChanged }) {
  const [mode, setMode] = useState("view");
  const [text, setText] = useState(comment.comment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const commentAuthorId = comment.commenter_id?._id || comment.commenter_id;
  const isOwnComment = ownId !== null && String(commentAuthorId) === String(ownId);
  const commenterName = comment.commenter_id?.username || comment.commenter_id?.email || "User";
  const commentDate = new Date(comment.createdAt).toLocaleDateString("el-GR");

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setBusy(true);
    setError("");
    try {
      await request(`/api/review-comments/${comment._id}`, {
        method: "PUT",
        auth: true,
        body: { comment: text.trim() },
      });
      setMode("view");
      onCommentChanged?.();
    } catch (err) {
      setError(err.message || "Failed to update reply.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError("");
    try {
      await request(`/api/review-comments/${comment._id}`, {
        method: "DELETE",
        auth: true,
      });
      onCommentChanged?.();
    } catch (err) {
      setError(err.message || "Failed to delete reply.");
      setMode("view");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`rounded-[10px] border px-4 py-3 text-sm ${
        isOwnComment
          ? "border-line border-l-[3px] border-l-brand bg-surface-light"
          : "border-line bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {isOwnComment ? (
          <span className="text-sm font-semibold">You</span>
        ) : commenterName ? (
          <Link
            to={`/profile?username=${encodeURIComponent(commenterName)}`}
            className="text-sm font-semibold hover:underline"
          >
            {commenterName}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-muted">Unknown user</span>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted">
          {(comment.isEdited || comment.updatedAt !== comment.createdAt) && (
            <span className="italic">(edited)</span>
          )}
          <span>{commentDate}</span>
        </div>
      </div>

      {mode === "view" && (
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{comment.comment}</p>
      )}

      {isOwnComment && mode === "view" && (
        <div className="mt-2 flex justify-end gap-3 text-xs">
          <button
            type="button"
            className="cursor-pointer text-brand hover:underline"
            onClick={() => {
              setText(comment.comment);
              setError("");
              setMode("edit");
            }}
          >
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

      {isOwnComment && mode === "confirm" && (
        <div className="mt-2 flex items-center justify-end gap-2 text-xs">
          <span>Delete reply?</span>
          <button
            type="button"
            className="btn btn-danger px-2.5 py-0.5"
            disabled={busy}
            onClick={handleDelete}
          >
            Yes
          </button>
          <button
            type="button"
            className="btn px-2.5 py-0.5"
            disabled={busy}
            onClick={() => setMode("view")}
          >
            No
          </button>
        </div>
      )}

      {isOwnComment && mode === "edit" && (
        <form className="mt-2 flex flex-col gap-2" onSubmit={handleSaveEdit}>
          <textarea
            className="input block min-h-[60px] w-full resize-y text-xs"
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button type="submit" className="btn px-3 py-1 text-xs" disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="cursor-pointer text-xs text-muted hover:underline"
              disabled={busy}
              onClick={() => setMode("view")}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="error mt-1 text-xs">{error}</p>}
    </div>
  );
}

function ReviewCard({ review, isOwn, ownId, isLoggedIn, onChanged }) {
  const [mode, setMode] = useState("view");
  const [text, setText] = useState(review.text);
  const [rating, setRating] = useState(review.rating);
  const [isPrivate, setIsPrivate] = useState(review.isPrivate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  const author = review.user_id?.username;
  const date = new Date(review.reviewDate).toLocaleDateString("el-GR");
  const isPublic = !review.isPrivate;
  const reviewId = review._id;

  const messageFor = (err, fallback) =>
    err.status === 401 ? "Your session expired. Please sign in again." : err.message || fallback;

  useEffect(() => {
    if (!reviewId || !isPublic) return;
    let cancelled = false;

    request(`/api/review-comments/review/${reviewId}`)
      .then((comms) => {
        if (cancelled) return;
        setComments(comms.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      })
      .catch((err) => {
        console.error("Failed to load comments:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [reviewId, isPublic]);

  const fetchComments = async () => {
    try {
      const comms = await request(`/api/review-comments/review/${reviewId}`);
      setComments(comms.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    setReplyError("");
    try {
      await request(`/api/review-comments/review/${reviewId}`, {
        method: "POST",
        auth: true,
        body: { comment: replyText.trim() },
      });
      setReplyText("");
      setIsPopupOpen(false);
      setShowReplies(true);
      await fetchComments();
    } catch (err) {
      setReplyError(messageFor(err, "Failed to post reply."));
    } finally {
      setSubmittingReply(false);
    }
  };

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
      await request(`/api/user-reviews/${review._id}`, { method: "DELETE", auth: true });
      onChanged?.();
    } catch (err) {
      setError(messageFor(err, "Could not delete the review."));
      setMode("view");
    } finally {
      setBusy(false);
    }
  };

  const isEdited =
    Boolean(review.isEdited) ||
    (review.updatedAt && review.createdAt && new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 1000);

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
              review.isPrivate ? "border-success text-success" : "border-brand text-brand"
            }`}
          >
            {review.isPrivate ? "Personal" : "Public"}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2 text-xs text-muted">
          {isEdited && <span className="italic">(edited)</span>}
          <span>{date}</span>
        </div>
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

      {mode === "view" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            {isPublic && comments.length > 0 && (
              <button
                type="button"
                className="cursor-pointer font-medium text-brand hover:underline rounded-md bg-brand/10 px-3 py-1 text-xs border border-brand/40 transition-colors"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? "Hide replies" : `Show all replies (${comments.length})`}
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Reply button only shown if the user is logged in */}
            {isPublic && isLoggedIn && (
              <button
                type="button"
                className="cursor-pointer text-brand hover:underline font-semibold"
                onClick={() => {
                  setReplyText("");
                  setReplyError("");
                  setIsPopupOpen(true);
                }}
              >
                Reply
              </button>
            )}

            {isOwn && (
              <>
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
              </>
            )}
          </div>
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

      {/* Tabbed Replies Section */}
      {isPublic && showReplies && comments.length > 0 && (
        <div className="mt-3 ml-6 flex flex-col gap-3 border-l-2 border-brand/20 pl-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              ownId={ownId}
              onCommentChanged={fetchComments}
            />
          ))}
        </div>
      )}

      {/* Reply Popup Modal */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-[14px] border border-line bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Reply to {author || "review"}</h3>
              <button
                type="button"
                onClick={() => setIsPopupOpen(false)}
                className="text-muted hover:text-foreground text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {replyError && <p className="mb-3 text-sm text-danger-text">{replyError}</p>}

            <form onSubmit={handleReplySubmit} className="flex flex-col gap-4">
              <textarea
                className="input block min-h-[100px] w-full resize-y leading-normal"
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={1000}
                required
              />
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{replyText.length}/1000 characters</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPopupOpen(false)}
                    className="btn bg-transparent border border-line text-muted px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn px-5 py-2" disabled={submittingReply}>
                    {submittingReply ? "Posting..." : "Post Reply"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </li>
  );
}

export default function ReviewList({ reviews, loggedUser, loading = false, onChanged }) {
  const [sortBy, setSortBy] = useState("recency");
  const [order, setOrder] = useState("desc");

  const ownId = loggedUser ? String(loggedUser.id ?? loggedUser._id) : null;
  const isLoggedIn = Boolean(loggedUser);
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
                ownId={ownId}
                isLoggedIn={isLoggedIn}
                onChanged={onChanged}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}