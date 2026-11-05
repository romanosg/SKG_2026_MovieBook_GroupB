import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import Pager from "../components/Pager";
import SelectControl from "../components/SelectControl";
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

// Shows the movies a user has watched: /watched?username=anna
// Without a username in the address it shows the logged-in user's own list.
export default function WatchedMoviesPage() {
  const [searchParams] = useSearchParams();
  const loggedUser = useLoggedUser();

  const [sortBy, setSortBy] = useState(WATCHED_SORT_OPTIONS[0].value); // recently added unless changed
  const [genre, setGenre] = useState(""); // "" means all genres
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

  // Every genre that exists in the user's watched list, for the dropdown
  const availableGenres = [
    ...new Set(
      watched.flatMap((item) => item.movie_id?.genre || [])
    ),
  ].sort();

  const genreOptions = [
    { value: "", label: "All" },
    ...availableGenres.map((g) => ({ value: g, label: g })),
  ];

  // Filter by the chosen genre, then sort
  const filteredWatched = watched.filter((item) => {
    if (!genre) return true;
    return item.movie_id?.genre?.includes(genre);
  });

  const sorted = sortWatched(filteredWatched, sortBy);
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
          id="watched-genre"
          label="Genre"
          value={genre}
          onChange={(value) => {
            setGenre(value);
            setPage(1);
          }}
          options={genreOptions}
        />
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

          {sorted.length === 0 && <p className="mt-4 text-muted">No watched movies match your selection.</p>}

          {sorted.length > 0 && (
            <ul className="mt-4 grid grid-cols-[repeat(auto-fill,var(--poster-width))] items-start justify-center gap-6 p-0">
              {pageItems.map((item) => {
                const movie = item.movie_id; // the movie (null if it was deleted)
                const moviePath = movie?._id ? `/movies/${slugify(movie.title) || movie._id}` : "#";
                const linkState = movie?._id ? { movieId: movie._id } : undefined;

                return (
                  <li key={item._id} className="w-(--poster-width) text-center flex flex-col items-center">
                    {movie?._id ? (
                      <Link to={moviePath} state={linkState} className="block w-(--poster-width) cursor-pointer">
                        {movie.poster_url ? (
                          <img
                            src={movie.poster_url}
                            alt=""
                            className="block h-auto w-(--poster-width) rounded-lg bg-surface"
                          />
                        ) : (
                          <div className="flex aspect-[2/3] w-(--poster-width) items-center justify-center rounded-lg bg-surface text-sm text-muted">
                            No image
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="flex aspect-[2/3] w-(--poster-width) items-center justify-center rounded-lg bg-surface text-sm text-muted">
                        No image
                      </div>
                    )}

                    <p className="mt-2 text-base font-bold [overflow-wrap:anywhere]">
                      {movie?._id ? (
                        <Link 
                          to={moviePath} 
                          state={linkState} 
                          className="cursor-pointer hover:underline"
                        >
                          {movie.title}
                        </Link>
                      ) : (
                        <span className="text-muted">Unknown movie</span>
                      )}
                    </p>
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