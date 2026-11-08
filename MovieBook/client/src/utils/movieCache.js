const STORAGE_KEY = "afj_movie_cache";

const CACHE_KEYS = [
  "/api/movies",
  "/api/movies/featured",
  "/api/movies/reviewed",
];

let savedMovies = {};

try {
  savedMovies = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "{}"
  );
} catch {
  savedMovies = {};
}

const movieCache = new Map(
  Object.entries(savedMovies).filter(
    ([key, value]) =>
      CACHE_KEYS.includes(key) && Array.isArray(value)
  )
);

const originalSet = movieCache.set.bind(movieCache);

movieCache.set = (key, value) => {
  originalSet(key, value);

  if (CACHE_KEYS.includes(key)) {
    try {
      const dataToSave = {};

      CACHE_KEYS.forEach((cacheKey) => {
        if (movieCache.has(cacheKey)) {
          dataToSave[cacheKey] = movieCache.get(cacheKey);
        }
      });

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(dataToSave)
      );
    } catch (error) {
      console.warn("Could not save movie cache:", error);
    }
  }

  return movieCache;
};

export { movieCache };