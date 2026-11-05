import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { slugify } from "../utils/slug";
import { request } from "../utils/api";
import { MOVIE_ORDER_OPTIONS, MOVIE_SORT_OPTIONS, sortMovies } from "../utils/movieOrder";
import PageLayout from "../components/PageLayout";
import Pager from "../components/Pager";
import SelectControl from "../components/SelectControl";
import logo from "../assets/AFJ_circle_logo_1.png";

// Maximum number of movies shown on one page (change this to show more or fewer)
const MOVIES_PER_PAGE = 8;

// How many page numbers to show before and after the current page
const PAGES_BEFORE_CURRENT = 3;
const PAGES_AFTER_CURRENT = 5;

// Jump size X: besides the pages around the current one, the page bar also shows the page
// X away in each direction (e.g. on page 12 with X = 10: pages 2 and 22). See utils/paging.js.
// X must be bigger than the number of page buttons shown at once; a too small value is raised
// automatically.
const PAGE_JUMP = 10;

// The movie's picture comes from its poster_url field
// (the picture's width is --poster-width in App.css)
const getImageUrl = (movie) => movie.poster_url || "";

export default function BrowsePage() {
  const navigate = useNavigate();

  // Movie search
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]); // current results (all movies or search results)
  const [allMovies, setAllMovies] = useState([]); // every movie, used for the genre list
  const [searchTerm, setSearchTerm] = useState(""); // the search that was actually submitted
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters and order
  const [page, setPage] = useState(1);
  const [genre, setGenre] = useState(""); // "" means all genres
  const [sortBy, setSortBy] = useState(MOVIE_SORT_OPTIONS[0].value); // date unless changed
  const [order, setOrder] = useState("desc"); // newest first unless changed

  // User search
  const [username, setUsername] = useState("");
  const [userError, setUserError] = useState("");
  const [userSearching, setUserSearching] = useState(false);

  // No title: GET /api/movies (all movies). With a title: GET /api/movies/search?title=...
  const loadMovies = async (title = "") => {
    setLoading(true);
    setError("");
    try {
      const trimmed = title.trim();
      const url = trimmed
        ? `/api/movies/search?title=${encodeURIComponent(trimmed)}`
        : "/api/movies";
     const data = await request(url);
      
      setMovies(data);
      setSearchTerm(trimmed);
      if (!trimmed) setAllMovies(data); // an empty search returns every movie
      setPage(1); // new results start on the first page
      // the chosen genre is kept, so an empty search shows all movies of that genre
    } catch (err) {
      console.error("Error loading movies:", err);
      setMovies([]);
      setError("Could not load movies. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  // Show every movie when the page first opens
  useEffect(() => {
    loadMovies();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    loadMovies(query); // an empty search shows all movies again
  };

  // Finds a user by username (upper/lower case doesn't matter) and opens their profile
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
      const data = await request(`/api/user/user-info?username=${encodeURIComponent(typed)}`);
      // the server answers with the username as it was registered, so the link uses that
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
  const genreOptions = [{ value: "", label: "All" }, ...genres.map((g) => ({ value: g, label: g }))];

  // Filter by the chosen genre, then put the movies in the chosen order
  const sortedMovies = sortMovies(
    movies.filter((movie) => !genre || (movie.genre || []).includes(genre)),
    sortBy,
    order
  );

  // Heading: "Movies (Genre)" normally, or the search wording after a search
  const genreText = genre || "All";
  const heading = searchTerm
    ? `Movie results with '${searchTerm}' (${genreText})`
    : `Movies (${genreText})`;

  // Only the movies belonging to the current page
  const totalPages = Math.ceil(sortedMovies.length / MOVIES_PER_PAGE);
  const firstIndex = (page - 1) * MOVIES_PER_PAGE;
  const visibleMovies = sortedMovies.slice(firstIndex, firstIndex + MOVIES_PER_PAGE);

  return (
    <PageLayout page="browse">
      {/* Logo on the left; the searches and filters centered in the space that remains */}
      <div className="flex items-center gap-6">
        <div className="relative aspect-square w-[clamp(120px,25vw,280px)] shrink-0">
          <img src={logo} alt="AFJ logo" className="absolute inset-0 size-full object-contain" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
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
              <button className="btn h-11 shrink-0 px-5 py-0" type="submit" disabled={userSearching}>
                {userSearching ? "Searching..." : "Find user"}
              </button>
            </form>
            {userError && (
              <p className="error mt-1.5" role="alert">
                {userError}
              </p>
            )}
          </div>

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

      {loading && <p className="mt-4 text-muted">Loading movies...</p>}
      {error && <p className="mt-4 text-danger-text">{error}</p>}
      {!loading && !error && sortedMovies.length === 0 && (
        <p className="mt-4 text-muted">No movies found.</p>
      )}

      {/* Movie cards in fixed-width columns: every row starts at the same left edge,
          while the whole block stays centered so left and right space match */}
      {!loading && visibleMovies.length > 0 && (
        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,var(--poster-width))] items-start justify-center gap-6 p-0">
          {visibleMovies.map((movie) => {
            const imageUrl = getImageUrl(movie);
            // the address shows the movie's name, e.g. /movies/the-dark-knight
            // (falls back to the id if the title has no letters or digits)
            const moviePath = `/movies/${slugify(movie.title) || movie._id}`;
            // the id travels with the click (not in the address) so the movie loads directly
            const linkState = { movieId: movie._id };
            return (
              <li key={movie._id} className="w-(--poster-width) text-center">
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
                  {/* the title is underlined only while hovered */}
                  <Link to={moviePath} state={linkState} className="cursor-pointer hover:underline">
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
