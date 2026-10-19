import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import formStyles from "./formStyles";
import logo from "../assets/AFJ_circle_logo.png";

// Maximum number of movies shown on one page (change this to show more or fewer)
const MOVIES_PER_PAGE = 5;

// How many page numbers to show before and after the current page
const PAGES_BEFORE_CURRENT = 1;
const PAGES_AFTER_CURRENT = 1;

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
  pageButton: {
    background: "#242424",
    color: "#e8e8e8",
    border: "1px solid #4a4a4a",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 14,
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
            const moviePath = `/movies/${movie._id}`;
            return (
              <li key={movie._id} style={styles.movieCard}>
                <Link to={moviePath} style={styles.movieImageLink} aria-label={movie.title}>
                  {imageUrl ? (
                    <img src={imageUrl} alt="" style={styles.movieImage} />
                  ) : (
                    <div style={styles.moviePlaceholder}>No image</div>
                  )}
                </Link>
                <p style={styles.movieName}>
                  <Link to={moviePath} className="movie-title-link">
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

          {getPageItems(page, totalPages).map((item) => (
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
        </nav>
      )}
    </main>
  );
}
