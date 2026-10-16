import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import formStyles from "./formStyles";

const ACCENT = "#8ab4f8";

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
    background: "#242424",
  },
  posterPlaceholder: {
    width: "min(100%, 320px)",
    aspectRatio: "2 / 3",
    borderRadius: 10,
    background: "#242424",
    color: "#9a9a9a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  details: { flex: 1, minWidth: 260 },
  title: { margin: 0, fontSize: 40, fontWeight: 700, lineHeight: 1.15 },
  year: { margin: "6px 0 0", fontSize: 18, color: "#9a9a9a" },
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
  message: { color: "#9a9a9a" },
  errorMessage: { color: "#ff8a80" },
};

export default function MoviePage() {
  const { id } = useParams(); // the :id from the address /movies/:id
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
        const response = await fetch(`/api/movies/${id}`);
        if (response.status === 400 || response.status === 404) {
          throw new Error("not-found");
        }
        if (!response.ok) throw new Error("failed");
        const data = await response.json();
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
  }, [id]);

  return (
    <main style={formStyles.page}>
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

              <h2 style={styles.sectionLabel}>Director</h2>
              <p style={styles.text}>{movie.director}</p>

              <h2 style={styles.sectionLabel}>Description</h2>
              <p style={styles.text}>{movie.description}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
