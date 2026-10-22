// "The Dark Knight" -> "the-dark-knight": the movie's name as shown in its page address
export const slugify = (title) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // drop accents: é -> e
    .replace(/[^a-z0-9]+/g, "-") // anything else becomes a dash
    .replace(/^-+|-+$/g, ""); // no dashes at the start or end
