import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import Pager from "../components/Pager";
import SelectControl from "../components/SelectControl";
import StarRating from "../components/StarRating";
import { useLoggedUser } from "../utils/useLoggedUser";
import { slugify } from "../utils/slug";
import { request } from "../utils/api";
import { WATCHED_SORT_OPTIONS, sortWatched } from "../utils/watchedOrder";

// Maximum number of watched movies shown on one page (change this to show more or fewer)
const WATCHED_PER_PAGE = 8;

// Page bar settings (the same ones the other pages use)
const PAGES_BEFORE_CURRENT = 3;
const PAGES_AFTER_CURRENT = 5;
const PAGE_JUMP = 10;

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "");

// Shows the movies a user has watched: /watched?username=anna
// Without a username in the address it shows the logged-in user's own list.
export default function WatchedMoviesPage() {
  const [searchParams] = useSearchParams();
  const loggedUser = useLoggedUser();

  const [sortBy, setSortBy] = useState(WATCHED_SORT_OPTIONS[0].value); // recently added unless changed
  const [page, setPage] = useState(1);

  const [watched, setWatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const username = searchParams.get("username") || loggedUser?.username;
  const isOwn =
    Boolean(loggedUser?.username) &&
    Boolean(username) &&
    loggedUser.username.toLowerCase() === username.toLowerCase();

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    setLoading(true);
    setError("");

    request(`/api/watched-movies/username/${encodeURIComponent(username)}`)
      .then((data) => {
        if (cancelled) return;
        setWatched(data);
        setPage(1); // a new list starts on the first page
      })
      .catch((err) => {
        if (cancelled) return;
        setWatched([]);
        setError(
          err.status === 404 && err.hasMessage
            ? "User not found."
            : "Could not load the watched movies. Is the server running?"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  // No username in the address and nobody logged in
  if (!username) {
    return (
      <PageLayout page="watched">
        <p className="mt-4 text-muted">
          Please{" "}
          <Link to="/sign-in" className="text-brand">
            sign in
          </Link>{" "}
          to see your watched movies.
        </p>
      </PageLayout>
    );
  }

  // The movies in the chosen order, and only those of the current page
  const sorted = sortWatched(watched, sortBy);
  const totalPages = Math.ceil(sorted.length / WATCHED_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const firstIndex = (currentPage - 1) * WATCHED_PER_PAGE;
  const pageItems = sorted.slice(firstIndex, firstIndex + WATCHED_PER_PAGE);

  const heading = isOwn ? "My Watched Movies" : `${username}'s Watched Movies`;

  return (
    <PageLayout page="watched">
      <h1 className="mb-5 text-[32px] font-bold [overflow-wrap:anywhere]">{heading}</h1>

      <div className="flex flex-wrap items-center justify-center gap-5">
        <SelectControl
          id="watched-sort"
          label="Sort by"
          value={sortBy}
          onChange={(value) => {
            setSortBy(value);
            setPage(1);
          }}
          options={WATCHED_SORT_OPTIONS}
        />
      </div>

      {loading && <p className="mt-5 text-muted">Loading watched movies...</p>}
      {error && <p className="mt-5 text-danger-text">{error}</p>}

      {!loading && !error && (
        <>
          <p className="mt-5 text-muted">
            {sorted.length} {sorted.length === 1 ? "movie" : "movies"}
          </p>

          {sorted.length === 0 && <p className="mt-4 text-muted">No watched movies yet.</p>}

          {sorted.length > 0 && (
            <ul className="mt-4 flex flex-col gap-4 p-0">
              {pageItems.map((item) => {
                const movie = item.movie_id; // the movie (null if it was deleted)
                return (
                  <li
                    key={item._id}
                    className="flex gap-4 rounded-[10px] border border-line bg-surface p-4"
                  >
                    {movie?.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt=""
                        className="aspect-[2/3] w-14 shrink-0 rounded-md bg-field object-cover"
                      />
                    ) : (
                      <div className="aspect-[2/3] w-14 shrink-0 rounded-md bg-field" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        {movie?._id ? (
                          <Link
                            to={`/movies/${slugify(movie.title) || movie._id}`}
                            state={{ movieId: movie._id }}
                            className="text-lg font-bold hover:underline"
                          >
                            {movie.title}
                          </Link>
                        ) : (
                          <span className="text-lg font-bold text-muted">Unknown movie</span>
                        )}
                        <span className="text-xs text-muted">
                          Added {formatDate(item.createdAt ?? item.watchedAt)}
                        </span>
                      </div>

                      {movie?.year && <p className="text-sm text-muted">{movie.year}</p>}

                      <div className="mt-1 flex items-center gap-2">
                        <StarRating rating={item.rating} size={20} />
                        <span className="text-sm text-muted">{item.rating} / 5</span>
                      </div>

                      {item.review && (
                        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                          {item.review}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Pager
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            pagesBefore={PAGES_BEFORE_CURRENT}
            pagesAfter={PAGES_AFTER_CURRENT}
            jumpSize={PAGE_JUMP}
            label="Watched movie pages"
          />
        </>
      )}
    </PageLayout>
  );
}
