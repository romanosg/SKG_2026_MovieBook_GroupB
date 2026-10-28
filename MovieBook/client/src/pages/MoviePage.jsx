import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { slugify } from "../utils/slug";
import PageLayout from "../components/PageLayout";
import StarRating from "../components/StarRating";

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
      <div className="mx-auto max-w-[1000px]">
        <Link to="/" className="mb-6 inline-block text-sm text-brand">
          ← Back to movies
        </Link>

        {loading && <p className="text-muted">Loading movie...</p>}
        {error && <p className="text-danger-text">{error}</p>}

        {movie && (
          <div className="flex flex-wrap items-start gap-8">
            {movie.poster_url ? (
              <img
                src={movie.poster_url}
                alt={`${movie.title} poster`}
                className="block h-auto w-[min(100%,320px)] rounded-[10px] bg-surface"
              />
            ) : (
              <div className="flex aspect-[2/3] w-[min(100%,320px)] items-center justify-center rounded-[10px] bg-surface text-muted">
                No image
              </div>
            )}

            <div className="min-w-[260px] flex-1">
              <h1 className="m-0 text-[40px] leading-[1.15] font-bold">{movie.title}</h1>
              <p className="mt-1.5 text-lg text-muted">{movie.year}</p>

              {movie.genre?.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2 p-0" aria-label="Genres">
                  {movie.genre.map((g) => (
                    <li
                      key={g}
                      className="rounded-full border border-brand px-3.5 py-1 text-[13px] text-brand"
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              )}

              <h2 className="label-brand mt-7 mb-1.5 text-center">Director</h2>
              <p className="m-0 text-center text-base leading-[1.6] whitespace-pre-wrap">
                {movie.director}
              </p>

              <h2 className="label-brand mt-7 mb-1.5 text-left">Description</h2>
              <p className="m-0 text-left text-base leading-[1.6] whitespace-pre-wrap">
                {movie.description}
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <span className="text-base">
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
