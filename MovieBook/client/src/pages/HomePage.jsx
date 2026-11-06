
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { request } from "../utils/api";
import { slugify } from "../utils/slug";
import logo from "../assets/AFJ_circle_logo_1.png";

function MovieGrid({ movies, featured = false }) {
  if (!movies.length) {
    return (
      <p className="text-muted">
        No movies available at the moment.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
      {movies.map((movie) => (
        <Link
          key={movie._id}
          to={`/movies/${slugify(movie.title) || movie._id}`}
          state={{ movieId: movie._id }}
          className="group text-center"
        >
          {movie.poster_url ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="aspect-[2/3] w-full rounded-lg object-cover transition duration-300 group-hover:scale-[1.03] group-hover:shadow-xl"
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-lg bg-surface text-sm text-muted">
              No image
            </div>
          )}

          <p className="mt-3 font-bold group-hover:text-brand">
            {movie.title}
          </p>

          {featured && (
            <p className="mt-1 text-sm text-muted">
              {movie.publicReviewCount || 0} public reviews
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [discoverMovies, setDiscoverMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const [featuredData, allMoviesData] = await Promise.all([
          request("/api/movies/featured"),
          request("/api/movies"),
        ]);

        const featured = Array.isArray(featuredData)
          ? featuredData
          : [];

        const allMovies = Array.isArray(allMoviesData)
          ? allMoviesData
          : [];

        setFeaturedMovies(featured);

        const featuredIds = new Set(
          featured.map((movie) => movie._id)
        );

        const discover = allMovies
          .filter((movie) => !featuredIds.has(movie._id))
          .slice(0, 4);

        setDiscoverMovies(discover);
      } catch (error) {
        console.error("Error loading movies:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  return (
    <PageLayout page="home" className="space-y-12">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#24344d] via-[#192333] to-[#121212] px-6 py-12 md:px-12 md:py-16">
        <div className="flex flex-col items-center gap-10 md:flex-row md:justify-between">

          <div className="max-w-2xl text-center md:text-left">
            <p className="mb-4 text-sm font-bold uppercase tracking-[4px] text-brand">
              Welcome to
            </p>

            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Appraisal Film Journal
            </h1>

            <p className="mt-6 text-base leading-7 text-soft md:text-lg">
              Discover movies, share your opinions and explore
              the world of cinema through reviews and ratings.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
              <Link to="/browse" className="btn px-6 py-3">
                Explore Movies
              </Link>

              <Link
                to="/sign-up"
                className="rounded-md border border-brand px-6 py-3 font-semibold text-brand transition hover:bg-brand hover:text-on-btn"
              >
                Join Us
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 justify-center">
            <img
              src={logo}
              alt="Appraisal Film Journal Logo"
              className="w-48 drop-shadow-2xl md:w-64"
            />
          </div>

        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="mx-auto max-w-3xl text-center">
        <p className="label-brand">About Us</p>

        <h2 className="mt-3 text-3xl font-bold">
          Your Personal Movie Journal
        </h2>

        <p className="mt-5 leading-7 text-soft">
          Appraisal Film Journal is a place for movie lovers.
          Discover films, write reviews, rate your favorites
          and keep track of everything you watch.
          Share your passion for cinema with others!
        </p>
      </section>

      {/* FEATURES SECTION */}
      <section>
        <div className="mb-6 text-center">
          <p className="label-brand">What You Can Do</p>
          <h2 className="mt-2 text-3xl font-bold">
            Everything About Movies
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">

          <div className="rounded-xl border border-line bg-surface p-6 text-center">
            <div className="mb-3 text-3xl">🎬</div>
            <h3 className="text-xl font-bold">Discover Movies</h3>
            <p className="mt-3 text-sm leading-6 text-soft">
Find your next favorite film from our movie collection.            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 text-center">
            <div className="mb-3 text-3xl">⭐</div>
            <h3 className="text-xl font-bold">Rate & Review</h3>
            <p className="mt-3 text-sm leading-6 text-soft">
              Share your thoughts and rate the movies you watch.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 text-center">
            <div className="mb-3 text-3xl">📚</div>
            <h3 className="text-xl font-bold">Track Your Movies</h3>
            <p className="mt-3 text-sm leading-6 text-soft">
              Keep a personal record of your watched movies.
            </p>
          </div>

        </div>
      </section>

      {/* FEATURED MOVIES */}
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-brand">Most Reviewed</p>
            <h2 className="mt-2 text-3xl font-bold">
              Featured Movies
            </h2>
            <p className="mt-2 text-sm text-soft">
              Movies with the most public reviews from our community.
            </p>
          </div>

        <Link
  to="/browse?filter=featured"
  className="font-semibold text-brand hover:underline"
>
  View All Featured Movies →
</Link>  
        </div>

        {loading ? (
          <p className="text-muted">Loading featured movies...</p>
        ) : (
          <MovieGrid movies={featuredMovies} featured />
        )}
      </section>

      {/* DISCOVER MOVIES */}
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-brand">Explore Cinema</p>
            <h2 className="mt-2 text-3xl font-bold">
              Discover Movies
            </h2>
            <p className="mt-2 text-sm text-soft">
              More films waiting for you to discover.
            </p>
          </div>

          <Link
            to="/browse"
            className="font-semibold text-brand hover:underline"
          >
            View All Movies →
          </Link>
        </div>

        {loading ? (
          <p className="text-muted">Loading movies...</p>
        ) : (
          <MovieGrid movies={discoverMovies} />
        )}
      </section>

      {/* FINAL SECTION */}
      <section className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-10 text-center">
        <h2 className="text-3xl font-bold">
          Ready to Explore the World of Cinema?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-soft">
          Start discovering movies, writing reviews
          and building your personal movie journal.
        </p>

        <Link
          to="/browse"
          className="btn mt-7 inline-block px-7 py-3"
        >
          Start Exploring
        </Link>
      </section>

    </PageLayout>
  );
}
