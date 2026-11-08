import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { slugify } from "../utils/slug";
import { request } from "../utils/api";
import { MOVIE_ORDER_OPTIONS, MOVIE_SORT_OPTIONS, sortMovies } from "../utils/movieOrder";
import PageLayout from "../components/PageLayout";
import Pager from "../components/Pager";
import SelectControl from "../components/SelectControl";
import logo from "../assets/AFJ_circle_logo_1.png";

const MOVIES_PER_PAGE = 8;
const PAGES_BEFORE_CURRENT = 3;
const PAGES_AFTER_CURRENT = 5;
const PAGE_JUMP = 10;

// Temporary cache for movie results
import { movieCache } from "../utils/movieCache";
const getImageUrl = (movie) => movie.poster_url || "";

export default function BrowsePage() {
  const navigate = useNavigate();

  // Movie search
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters and order
  const [page, setPage] = useState(1);
  const [genre, setGenre] = useState("");
  const [sortBy, setSortBy] = useState(MOVIE_SORT_OPTIONS[0].value);
  const [order, setOrder] = useState("desc");

  const [searchParams, setSearchParams] = useSearchParams();
  const featuredOnly = searchParams.get("filter") === "featured";

  // User search
  const [username, setUsername] = useState("");
  const [userError, setUserError] = useState("");
  const [userSearching, setUserSearching] = useState(false);

  // Load movies using cached results when available
  const loadMovies = async (title = "") => {
    const trimmed = title.trim();

    const url = trimmed
      ? `/api/movies/search?title=${encodeURIComponent(trimmed)}`
      : featuredOnly
        ? "/api/movies/reviewed"
        : "/api/movies";

    const cachedMovies = movieCache.get(url);

    if (cachedMovies) {
      setMovies(cachedMovies);
      setSearchTerm(trimmed);

      if (!trimmed) {
        setAllMovies(cachedMovies);
      }

      setPage(1);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await request(url);

      movieCache.set(url, data);

      setMovies(data);
      setSearchTerm(trimmed);

      if (!trimmed) {
        setAllMovies(data);
      }

      setPage(1);
    } catch (err) {
      console.error("Error loading movies:", err);

      if (!cachedMovies) {
        setMovies([]);
        setError("Could not load movies. Is the server running?");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show every movie when the page first opens
  useEffect(() => {
    loadMovies();
  }, [featuredOnly]);

  const handleSubmit = (e) => {
    e.preventDefault();
    loadMovies(query);
  };

  // Find a user by username and open their profile
  const handleUserSearch = async (e) => {
    e.preventDefault();

    const typed = username.trim();

    if (!typed) {
      setUserError("Type a username to search for.");
      return;
    }

    setUserSearching(true);
    setUserError("");

    try {
      const data = await request(
        `/api/user/user-info?username=${encodeURIComponent(typed)}`
      );

      navigate(`/profile?username=${encodeURIComponent(data.user.username)}`);
    } catch (err) {
      setUserError(
        err.status === 404 && err.hasMessage
          ? "No user with that username."
          : "Could not search users. Is the server running?"
      );
    } finally {
      setUserSearching(false);
    }
  };

  // Every genre that exists, for the dropdown
  const genres = [...new Set(allMovies.flatMap((movie) => movie.genre || []))].sort();

  const genreOptions = [
    { value: "", label: "All" },
    ...genres.map((g) => ({ value: g, label: g })),
  ];

  // Filter and sort movies
  const sortedMovies = sortMovies(
    movies.filter((movie) => !genre || (movie.genre || []).includes(genre)),
    sortBy,
    order
  );

  // Page heading
  const genreText = genre || "All";

  const heading = searchTerm
    ? `Movie results with '${searchTerm}' (${genreText})`
    : featuredOnly
      ? `Featured Movies (${genreText})`
      : `Movies (${genreText})`;

  // Movies belonging to the current page
  const totalPages = Math.ceil(sortedMovies.length / MOVIES_PER_PAGE);
  const firstIndex = (page - 1) * MOVIES_PER_PAGE;
  const visibleMovies = sortedMovies.slice(firstIndex, firstIndex + MOVIES_PER_PAGE);

  return (
    <PageLayout page="browse">
      {/* Logo and search controls */}
      <div className="flex items-center gap-6">
        <div className="relative aspect-square w-[clamp(120px,25vw,280px)] shrink-0">
          <img src={logo} alt="AFJ logo" className="absolute inset-0 size-full object-contain" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
          <div className="w-full max-w-[600px]">
            <form className="flex gap-2" onSubmit={handleUserSearch}>
              <input
                className="input h-11 min-w-0 flex-1"
                type="search"
                placeholder="Search users by username..."
                aria-label="Search users by username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUserError("");
                }}
              />

              <button
                className="btn h-11 shrink-0 px-5 py-0"
                type="submit"
                disabled={userSearching}
              >
                {userSearching ? "Searching..." : "Find user"}
              </button>
            </form>

            {userError && (
              <p className="error mt-1.5" role="alert">
                {userError}
              </p>
            )}
          </div>

          <form className="flex w-full max-w-[600px] gap-2" onSubmit={handleSubmit}>
            <input
              className="input h-11 min-w-0 flex-1"
              type="search"
              placeholder="Search movies..."
              aria-label="Search movies"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button className="btn h-11 shrink-0 px-5 py-0" type="submit">
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <SelectControl
              id="genre-select"
              label="Genre"
              value={genre}
              onChange={(value) => {
                setGenre(value);
                setPage(1);
              }}
              options={genreOptions}
            />

            <SelectControl
              id="browse-sort"
              label="Sort by"
              value={sortBy}
              onChange={(value) => {
                setSortBy(value);
                setPage(1);
              }}
              options={MOVIE_SORT_OPTIONS}
            />

            <SelectControl
              id="browse-order"
              label="Order"
              value={order}
              onChange={(value) => {
                setOrder(value);
                setPage(1);
              }}
              options={MOVIE_ORDER_OPTIONS}
            />
          </div>
        </div>
      </div>

      <h1 className="mt-8 text-left text-5xl leading-tight font-bold [overflow-wrap:anywhere]">
        {heading}
      </h1>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`rounded-lg px-5 py-2.5 font-semibold transition ${
            !featuredOnly
              ? "bg-brand text-white"
              : "bg-surface text-muted hover:text-brand"
          }`}
        >
          All Movies
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ filter: "featured" })}
          className={`rounded-lg px-5 py-2.5 font-semibold transition ${
            featuredOnly
              ? "bg-brand text-white"
              : "bg-surface text-muted hover:text-brand"
          }`}
        >
          Featured Movies
        </button>
      </div>

      {loading && <p className="mt-4 text-muted">Loading movies...</p>}
      {error && <p className="mt-4 text-danger-text">{error}</p>}

      {!loading && !error && sortedMovies.length === 0 && (
        <p className="mt-4 text-muted">No movies found.</p>
      )}

      {!loading && visibleMovies.length > 0 && (
        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,var(--poster-width))] items-start justify-center gap-6 p-0">
          {visibleMovies.map((movie) => {
            const imageUrl = getImageUrl(movie);
            const moviePath = `/movies/${slugify(movie.title) || movie._id}`;
            const linkState = { movieId: movie._id };

            return (
              <li
                key={movie._id}
                className="w-(--poster-width) text-center flex flex-col items-center"
              >
                <Link
                  to={moviePath}
                  state={linkState}
                  className="block w-(--poster-width) cursor-pointer"
                  aria-label={movie.title}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt=""
                      className="block h-auto w-(--poster-width) rounded-lg bg-surface"
                    />
                  ) : (
                    <div className="flex aspect-[2/3] w-(--poster-width) items-center justify-center rounded-lg bg-surface text-sm text-muted">
                      No image
                    </div>
                  )}
                </Link>

                <p className="mt-2 text-base font-bold [overflow-wrap:anywhere]">
                  <Link
                    to={moviePath}
                    state={linkState}
                    className="cursor-pointer hover:underline"
                  >
                    {movie.title}
                  </Link>
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && (
        <Pager
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pagesBefore={PAGES_BEFORE_CURRENT}
          pagesAfter={PAGES_AFTER_CURRENT}
          jumpSize={PAGE_JUMP}
          label="Movie pages"
        />
      )}
    </PageLayout>
  );
}