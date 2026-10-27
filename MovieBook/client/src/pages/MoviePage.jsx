import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { slugify } from "../utils/slug";
import PageLayout from "../components/PageLayout";
import StarRating from "../components/StarRating";

const ACCENT = "var(--page-accent)";

const styles = {
  wrapper: { maxWidth: 1000, margin: "0 auto" },
  back: {
    display: "inline-block",
    marginBottom: 24,
    color: ACCENT,
    textDecoration: "none",
    fontSize: 14,
  },
  layout: {
    display: "flex",
    flexWrap: "wrap",
    gap: 32,
    alignItems: "flex-start",
  },
  poster: {
    display: "block",
    width: "min(100%, 320px)",
    height: "auto",
    borderRadius: 10,
    background: "var(--page-surface)",
  },
  posterPlaceholder: {
    width: "min(100%, 320px)",
    aspectRatio: "2 / 3",
    borderRadius: 10,
    background: "var(--page-surface)",
    color: "var(--page-text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  details: { flex: 1, minWidth: 260 },
  title: { margin: 0, fontSize: 40, fontWeight: 700, lineHeight: 1.15 },
  year: { margin: "6px 0 0", fontSize: 18, color: "var(--page-text-muted)" },
  genres: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    margin: "20px 0 0",
    padding: 0,
    listStyle: "none",
  },
  genreChip: {
    border: `1px solid ${ACCENT}`,
    color: ACCENT,
    borderRadius: 999,
    padding: "4px 14px",
    fontSize: 13,
  },
  sectionLabel: {
    margin: "28px 0 6px",
    color: ACCENT,
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  text: { margin: 0, fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap" },
  reviewRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center", // centered, like the director
    flexWrap: "wrap",
    gap: 12,
    margin: "28px 0 0",
  },
  reviewCount: { fontSize: 16 },
  message: { color: "var(--page-text-muted)" },
  errorMessage: { color: "var(--page-danger-text)" },
};

export default function MoviePage() {
  const { id } = useParams(); // the movie's name (or old id) from the address /movies/:id
  const location = useLocation();
  const movieId = location.state?.movieId; // set when we arrive by clicking a movie
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false; // ignore the answer if we've already left this movie

    const loadMovie = async () => {
      setLoading(true);
      setError("");
      setMovie(null);
      try {
        // The address holds the movie's name (e.g. "the-dark-knight") or, in old links, an id.
        // When we arrive by clicking a movie in the list, its id is also passed along.
        const isDatabaseId = /^[a-f0-9]{24}$/i.test(id);
        const idToLoad = movieId || (isDatabaseId ? id : null);

        let data;
        if (idToLoad) {
          const response = await fetch(`/api/movies/${idToLoad}`);
          if (response.status === 400 || response.status === 404) {
            throw new Error("not-found");
          }
          if (!response.ok) throw new Error("failed");
          data = await response.json();
        } else {
          // Opened from a typed or shared link: find the movie by its name
          const response = await fetch("/api/movies");
          if (!response.ok) throw new Error("failed");
          const movies = await response.json();
          data = movies.find((m) => slugify(m.title) === id.toLowerCase());
          if (!data) throw new Error("not-found");
        }
        if (!cancelled) setMovie(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message === "not-found"
              ? "Movie not found."
              : "Could not load this movie. Is the server running?"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMovie();
    return () => {
      cancelled = true;
    };
  }, [id, movieId]);

  // Public reviews aren't implemented yet, so these are 0 for now.
  // Once the server sends reviewCount / averageRating (0 to 5), they show up here.
  const reviewCount = movie?.reviewCount ?? 0;
  const averageRating = movie?.averageRating ?? 0;

  return (
    <PageLayout page="movie">
      <div style={styles.wrapper}>
        <Link to="/" style={styles.back}>
          ← Back to movies
        </Link>

        {loading && <p style={styles.message}>Loading movie...</p>}
        {error && <p style={styles.errorMessage}>{error}</p>}

        {movie && (
          <div style={styles.layout}>
            {movie.poster_url ? (
              <img src={movie.poster_url} alt={`${movie.title} poster`} style={styles.poster} />
            ) : (
              <div style={styles.posterPlaceholder}>No image</div>
            )}

            <div style={styles.details}>
              <h1 style={styles.title}>{movie.title}</h1>
              <p style={styles.year}>{movie.year}</p>

              {movie.genre?.length > 0 && (
                <ul style={styles.genres} aria-label="Genres">
                  {movie.genre.map((g) => (
                    <li key={g} style={styles.genreChip}>
                      {g}
                    </li>
                  ))}
                </ul>
              )}

              <h2 style={{ ...styles.sectionLabel, textAlign: "center" }}>Director</h2>
              <p style={{ ...styles.text, textAlign: "center" }}>{movie.director}</p>

              <h2 style={{ ...styles.sectionLabel, textAlign: "left" }}>Description</h2>
              <p style={{ ...styles.text, textAlign: "left" }}>{movie.description}</p>

              <div style={styles.reviewRow}>
                <span style={styles.reviewCount}>
                  {reviewCount} public {reviewCount === 1 ? "review" : "reviews"}
                </span>
                <StarRating rating={averageRating} size={66} />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
