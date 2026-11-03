import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { slugify } from "../utils/slug";
import PageLayout from "../components/PageLayout";
import Pager from "../components/Pager";
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
