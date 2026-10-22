import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { slugify } from "../utils/slug";
import formStyles from "./formStyles";
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

// Width of each movie picture in pixels (the height follows the picture's own proportions)
const MOVIE_IMAGE_WIDTH = 240;

// The search bar and Search button share this height
const CONTROL_HEIGHT = 44;

// The movie's picture comes from its poster_url field
const getImageUrl = (movie) => movie.poster_url || "";

// Page numbers to show: a few pages before and after the current one
const getPageItems = (current, total) => {
  const first = Math.max(1, current - PAGES_BEFORE_CURRENT);
  const last = Math.min(total, current + PAGES_AFTER_CURRENT);
  const pages = [];
  for (let p = first; p <= last; p++) pages.push(p);
  return pages;
};

const styles = {
  // Logo on the left; title + search bar centered in the space that remains
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: 24,
  },
  // 3x the previous size (about 280px), shrinking a bit on small screens
  logoBox: {
    position: "relative",
    width: "clamp(120px, 25vw, 280px)",
    aspectRatio: "1 / 1",
    flexShrink: 0,
  },
  logo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  topContent: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    ...formStyles.title,
    textAlign: "center",
  },
  searchForm: {
    display: "flex",
    gap: 8,
    width: "100%",
    maxWidth: 600,
  },
  searchInput: {
    ...formStyles.input,
    flex: 1,
    minWidth: 0,
    height: CONTROL_HEIGHT,
  },
  searchButton: {
    ...formStyles.button,
    height: CONTROL_HEIGHT,
    padding: "0 20px",
    flexShrink: 0,
  },
  // Centered under the search bar; the dropdown is only as wide as its longest genre
  genreRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 12,
  },
  genreLabel: {
    color: "#8ab4f8",
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
    paddingBottom: 2,
    borderBottom: "2px solid #8ab4f8",
  },
  genreSelect: {
    ...formStyles.input,
    width: "auto",
    height: 40,
    padding: "0 12px",
    colorScheme: "dark",
    cursor: "pointer",
  },
  sectionTitle: {
    margin: "32px 0 0",
    fontSize: 48,
    fontWeight: 700,
    textAlign: "left",
    overflowWrap: "anywhere",
  },
  // Movie cards in fixed-width columns: every row starts at the same left edge,
  // while the whole block stays centered so left and right space match
  movieGrid: {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fill, ${MOVIE_IMAGE_WIDTH}px)`,
    justifyContent: "center",
    alignItems: "start",
    gap: 24,
    listStyle: "none",
    margin: "16px 0 0",
    padding: 0,
  },
  movieCard: {
    width: MOVIE_IMAGE_WIDTH,
    textAlign: "center",
  },
  // Link wrapping the picture: shows the "click" hand cursor
  movieImageLink: {
    display: "block",
    width: MOVIE_IMAGE_WIDTH,
    cursor: "pointer",
  },
  // Fixed width, height adjusts automatically to keep the picture's proportions
  movieImage: {
    display: "block",
    width: MOVIE_IMAGE_WIDTH,
    height: "auto",
    borderRadius: 8,
    background: "#242424",
  },
  moviePlaceholder: {
    width: MOVIE_IMAGE_WIDTH,
    aspectRatio: "2 / 3",
    borderRadius: 8,
    background: "#242424",
    color: "#9a9a9a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
  },
  movieName: {
    margin: "8px 0 0",
    fontSize: 16,
    fontWeight: 700,
    overflowWrap: "anywhere",
  },
  message: { margin: "16px 0 0", color: "#9a9a9a" },
  errorMessage: { margin: "16px 0 0", color: "#ff8a80" },
  // Page buttons below the results
  pager: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    margin: "32px 0 0",
  },
  // The border is written as separate properties (not the "border" shorthand), and the
  // font weight is always set, so switching between normal and active never leaves
  // a stale border color or bold text behind on a button that was active before
  pageButton: {
    background: "#242424",
    color: "#e8e8e8",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#4a4a4a",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 14,
    fontWeight: 400,
    cursor: "pointer",
  },
  pageButtonActive: {
    background: "#8ab4f8",
    color: "#1b1b1b",
    borderColor: "#8ab4f8",
    fontWeight: 600,
  },
  // First / Previous / Next / Last: filled blue, like the Search and Sign up buttons
  pageNavButton: {
    ...formStyles.button,
    border: "1px solid #8ab4f8",
    padding: "6px 14px",
  },
  pageButtonDisabled: { opacity: 0.4, cursor: "default" },
  // "..." between the jump page and the shown pages, marking skipped pages
  ellipsis: { color: "#9a9a9a", padding: "0 4px" },
  // "Go to page" box next to the Last button
  pageJumpForm: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: 0,
  },
  pageInput: {
    ...formStyles.input,
    width: 72,
    height: 32,
    padding: "0 8px",
    fontSize: 14,
    textAlign: "center",
  },
};

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
    <main style={formStyles.page}>
      {/* Movie titles are underlined only while hovered */}
      <style>{`
        .movie-title-link {
          color: inherit;
          text-decoration: none;
          cursor: pointer;
        }
        .movie-title-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div style={styles.topRow}>
        <div style={styles.logoBox}>
          <img src={logo} alt="AFJ logo" style={styles.logo} />
        </div>

        <div style={styles.topContent}>
          <h1 style={styles.title}>Welcome to Appraisal Film Journal!</h1>

          <form style={styles.searchForm} onSubmit={handleSubmit}>
            <input
              style={styles.searchInput}
              type="search"
              placeholder="Search movies..."
              aria-label="Search movies"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button style={styles.searchButton} type="submit">
              Search
            </button>
          </form>

          <div style={styles.genreRow}>
            <label htmlFor="genre-select" style={styles.genreLabel}>
              Genre
            </label>
            <select
              id="genre-select"
              style={styles.genreSelect}
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

      <h2 style={styles.sectionTitle}>{heading}</h2>

      {loading && <p style={styles.message}>Loading movies...</p>}
      {error && <p style={styles.errorMessage}>{error}</p>}
      {!loading && !error && sortedMovies.length === 0 && (
        <p style={styles.message}>No movies found.</p>
      )}

      {!loading && visibleMovies.length > 0 && (
        <ul style={styles.movieGrid}>
          {visibleMovies.map((movie) => {
            const imageUrl = getImageUrl(movie);
            // the address shows the movie's name, e.g. /movies/the-dark-knight
            // (falls back to the id if the title has no letters or digits)
            const moviePath = `/movies/${slugify(movie.title) || movie._id}`;
            // the id travels with the click (not in the address) so the movie loads directly
            const linkState = { movieId: movie._id };
            return (
              <li key={movie._id} style={styles.movieCard}>
                <Link to={moviePath} state={linkState} style={styles.movieImageLink} aria-label={movie.title}>
                  {imageUrl ? (
                    <img src={imageUrl} alt="" style={styles.movieImage} />
                  ) : (
                    <div style={styles.moviePlaceholder}>No image</div>
                  )}
                </Link>
                <p style={styles.movieName}>
                  <Link to={moviePath} state={linkState} className="movie-title-link">
                    {movie.title}
                  </Link>
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && totalPages > 1 && (
        <nav style={styles.pager} aria-label="Movie pages">
          <button
            type="button"
            style={{
              ...styles.pageNavButton,
              ...(page === 1 ? styles.pageButtonDisabled : {}),
            }}
            disabled={page === 1}
            onClick={() => setPage(1)}
          >
            First
          </button>

          <button
            type="button"
            style={{
              ...styles.pageNavButton,
              ...(page === 1 ? styles.pageButtonDisabled : {}),
            }}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          {showJumpBack && (
            <>
              <button
                type="button"
                style={styles.pageButton}
                title={`Go to page ${jumpBackPage}`}
                aria-label={`Go to page ${jumpBackPage}`}
                onClick={() => setPage(jumpBackPage)}
              >
                {jumpBackPage}
              </button>
              {/* pages are skipped between the jump page and the shown pages */}
              {windowFirst - jumpBackPage > 1 && (
                <span style={styles.ellipsis} aria-hidden="true">
                  ...
                </span>
              )}
            </>
          )}

          {pageItems.map((item) => (
            <button
              key={item}
              type="button"
              style={{
                ...styles.pageButton,
                ...(item === page ? styles.pageButtonActive : {}),
              }}
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
                <span style={styles.ellipsis} aria-hidden="true">
                  ...
                </span>
              )}
              <button
                type="button"
                style={styles.pageButton}
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
            style={{
              ...styles.pageNavButton,
              ...(page === totalPages ? styles.pageButtonDisabled : {}),
            }}
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>

          <button
            type="button"
            style={{
              ...styles.pageNavButton,
              ...(page === totalPages ? styles.pageButtonDisabled : {}),
            }}
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
          >
            Last
          </button>

          <form style={styles.pageJumpForm} onSubmit={handlePageJump}>
            <input
              style={styles.pageInput}
              type="text"
              inputMode="numeric"
              placeholder="Page"
              maxLength={String(totalPages).length}
              aria-label={`Go to page (1 to ${totalPages})`}
              value={pageInput}
              onChange={handlePageInputChange}
            />
            <button
              type="submit"
              style={{
                ...styles.pageNavButton,
                ...(pageInput === "" ? styles.pageButtonDisabled : {}),
              }}
              disabled={pageInput === ""}
            >
              Go
            </button>
          </form>
        </nav>
      )}
    </main>
  );
}
