import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { slugify } from "../utils/slug";
import PageLayout from "../components/PageLayout";
import logo from "../assets/AFJ_circle_logo_1.png";

// Maximum number of movies shown on one page (change this to show more or fewer)
const MOVIES_PER_PAGE = 8;

// How many page numbers to show before and after the current page
const PAGES_BEFORE_CURRENT = 3;
const PAGES_AFTER_CURRENT = 5;

// Jump size X: besides the pages around the current one, the pager also shows the page
// X away in each direction (e.g. on page 12 with X = 10: pages 2 and 22). If that would go
// past the first/last page, the first/last page is shown instead (e.g. on page 8: page 1),
// as long as it isn't already among the shown pages.
// X must be bigger than the number of page buttons shown at once, otherwise a jump
// would land on a page that is already visible. Too small a value is raised automatically.
const PAGE_JUMP = 10;
const PAGES_SHOWN = PAGES_BEFORE_CURRENT + 1 + PAGES_AFTER_CURRENT;
const JUMP_SIZE = Math.max(PAGE_JUMP, PAGES_SHOWN + 1);
if (PAGE_JUMP <= PAGES_SHOWN) {
  console.warn(
    `PAGE_JUMP (${PAGE_JUMP}) must be bigger than the ${PAGES_SHOWN} pages shown. Using ${JUMP_SIZE}.`
  );
}

// The movie's picture comes from its poster_url field
// (the picture's width is --poster-width in App.css)
const getImageUrl = (movie) => movie.poster_url || "";

// Page numbers to show: a few pages before and after the current one
const getPageItems = (current, total) => {
  const first = Math.max(1, current - PAGES_BEFORE_CURRENT);
  const last = Math.min(total, current + PAGES_AFTER_CURRENT);
  const pages = [];
  for (let p = first; p <= last; p++) pages.push(p);
  return pages;
};

// Blue First / Previous / Next / Last buttons of the page bar
const NAV_BUTTON_CLASS = "btn border border-brand py-1.5";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]); // current results (all movies or search results)
  const [allMovies, setAllMovies] = useState([]); // every movie, used for the genre list
  const [searchTerm, setSearchTerm] = useState(""); // the search that was actually submitted
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [genre, setGenre] = useState(""); // "" means all genres
  const [pageInput, setPageInput] = useState(""); // text in the "go to page" box

  // No title: GET /api/movies (all movies). With a title: GET /api/movies/search?title=...
  const loadMovies = async (title = "") => {
    setLoading(true);
    setError("");
    try {
      const trimmed = title.trim();
      const url = trimmed
        ? `/api/movies/search?title=${encodeURIComponent(trimmed)}`
        : "/api/movies";
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      setMovies(data);
      setSearchTerm(trimmed);
      if (!trimmed) setAllMovies(data); // an empty search returns every movie
      setPage(1); // new results start on the first page
      setPageInput("");
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

  // Every genre that exists, for the dropdown
  const genres = [...new Set(allMovies.flatMap((movie) => movie.genre || []))].sort();

  // Filter by the chosen genre, then newest year first (ties sorted by title)
  const sortedMovies = movies
    .filter((movie) => !genre || (movie.genre || []).includes(genre))
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));

  // Heading: "Movies (Genre)" normally, or the search wording after a search
  const genreText = genre || "All";
  const heading = searchTerm
    ? `Movie results with '${searchTerm}' (${genreText})`
    : `Movies (${genreText})`;

  // Only the movies belonging to the current page
  const totalPages = Math.ceil(sortedMovies.length / MOVIES_PER_PAGE);
  const firstIndex = (page - 1) * MOVIES_PER_PAGE;
  const visibleMovies = sortedMovies.slice(firstIndex, firstIndex + MOVIES_PER_PAGE);

  // The pages shown around the current one, plus a "jump page" at each end:
  // the page JUMP_SIZE away, or the first/last page if that comes first.
  // A jump page is only shown when it isn't already among the shown pages.
  const pageItems = getPageItems(page, totalPages);
  const windowFirst = pageItems[0];
  const windowLast = pageItems[pageItems.length - 1];
  const jumpBackPage = Math.max(1, page - JUMP_SIZE);
  const jumpForwardPage = Math.min(totalPages, page + JUMP_SIZE);
  const showJumpBack = jumpBackPage < windowFirst;
  const showJumpForward = jumpForwardPage > windowLast;

  // "Go to page" box: only valid page numbers (1 to totalPages) can be typed
  const handlePageInputChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits === "") {
      setPageInput("");
      return;
    }
    const number = Number(digits);
    if (number < 1 || number > totalPages) return; // ignore invalid page numbers
    setPageInput(String(number)); // also drops leading zeros
  };

  const handlePageJump = (e) => {
    e.preventDefault();
    if (pageInput === "") return;
    setPage(Math.min(Math.max(1, Number(pageInput)), totalPages));
    setPageInput("");
  };

  return (
    <PageLayout page="home">
      {/* Logo on the left; title + search bar centered in the space that remains */}
      <div className="flex items-center gap-6">
        <div className="relative aspect-square w-[clamp(120px,25vw,280px)] shrink-0">
          <img src={logo} alt="AFJ logo" className="absolute inset-0 size-full object-contain" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <h1 className="mb-5 text-center text-2xl font-semibold">
            Welcome to Appraisal Film Journal!
          </h1>

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

          <div className="mt-3 flex items-center justify-center gap-3">
            <label htmlFor="genre-select" className="label-brand border-b-2 border-brand pb-0.5">
              Genre
            </label>
            <select
              id="genre-select"
              className="select"
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                setPage(1);
                setPageInput("");
              }}
            >
              <option value="">All</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-left text-5xl leading-tight font-bold [overflow-wrap:anywhere]">
        {heading}
      </h2>

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

      {!loading && totalPages > 1 && (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Movie pages">
          <button
            type="button"
            className={NAV_BUTTON_CLASS}
            disabled={page === 1}
            onClick={() => setPage(1)}
          >
            First
          </button>

          <button
            type="button"
            className={NAV_BUTTON_CLASS}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          {showJumpBack && (
            <>
              <button
                type="button"
                className="page-btn"
                title={`Go to page ${jumpBackPage}`}
                aria-label={`Go to page ${jumpBackPage}`}
                onClick={() => setPage(jumpBackPage)}
              >
                {jumpBackPage}
              </button>
              {/* pages are skipped between the jump page and the shown pages */}
              {windowFirst - jumpBackPage > 1 && (
                <span className="px-1 text-muted" aria-hidden="true">
                  ...
                </span>
              )}
            </>
          )}

          {pageItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`page-btn ${item === page ? "page-btn-active" : ""}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          ))}

          {showJumpForward && (
            <>
              {/* pages are skipped between the shown pages and the jump page */}
              {jumpForwardPage - windowLast > 1 && (
                <span className="px-1 text-muted" aria-hidden="true">
                  ...
                </span>
              )}
              <button
                type="button"
                className="page-btn"
                title={`Go to page ${jumpForwardPage}`}
                aria-label={`Go to page ${jumpForwardPage}`}
                onClick={() => setPage(jumpForwardPage)}
              >
                {jumpForwardPage}
              </button>
            </>
          )}

          <button
            type="button"
            className={NAV_BUTTON_CLASS}
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>

          <button
            type="button"
            className={NAV_BUTTON_CLASS}
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
          >
            Last
          </button>

          <form className="m-0 flex items-center gap-2" onSubmit={handlePageJump}>
            <input
              className="input h-8 w-[72px] px-2 py-0 text-center"
              type="text"
              inputMode="numeric"
              placeholder="Page"
              maxLength={String(totalPages).length}
              aria-label={`Go to page (1 to ${totalPages})`}
              value={pageInput}
              onChange={handlePageInputChange}
            />
            <button type="submit" className={NAV_BUTTON_CLASS} disabled={pageInput === ""}>
              Go
            </button>
          </form>
        </nav>
      )}
    </PageLayout>
  );
}
