import React, { useState } from "react";
import formStyles from "./formStyles";

const styles = {
  searchInput: {
    ...formStyles.input,
    width: "100%",
    maxWidth: 520,
    boxSizing: "border-box",
  },
  sectionTitle: {
    margin: "32px 0 0",
    fontSize: 48,
    fontWeight: 700,
    textAlign: "left",
  },
};

export default function HomePage() {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: search movies with `query`
    console.log("Search:", query);
  };

  return (
    <main style={formStyles.page}>
      <h1 style={formStyles.title}>Welcome to MovieBook</h1>

      <form onSubmit={handleSubmit}>
        <input
          style={styles.searchInput}
          type="search"
          placeholder="Search movies..."
          aria-label="Search movies"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <h2 style={styles.sectionTitle}>Movies</h2>
    </main>
  );
}
