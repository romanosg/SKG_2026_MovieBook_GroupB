
const express = require('express');
const router = express.Router();

const Movie = require('../models/Movie');
const mongoose = require('mongoose');

// Add description as an API alias for the existing plot field.
// The database itself remains unchanged.
const formatMovie = (movie) => {
  const data = movie.toObject ? movie.toObject() : movie;

  return {
    ...data,
    description: data.plot || data.description || ''
  };
};

// GET /api/movies - Get all movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ title: 1 });

    res.status(200).json(movies.map(formatMovie));
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});

// GET /api/movies/search?q=dark
// Search by title, plot/description, director and genre
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || req.query.title;

    if (typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        message: 'Please provide a search term'
      });
    }

    const searchTerm = query.trim();

    // Escape special regex characters
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regex = new RegExp(escapedTerm, 'i');

    const movies = await Movie.find({
      $or: [
        { title: regex },
        { plot: regex },
        { director: regex },
        { genre: regex }
      ]
    });

    // Lower number means higher priority
    const getPriority = (movie) => {
      if (regex.test(movie.title || '')) return 1;

      if (regex.test(movie.plot || '')) return 2;

      if (regex.test(movie.director || '')) return 3;

      const genres = Array.isArray(movie.genre)
        ? movie.genre
        : [movie.genre || ''];

      if (genres.some((genre) => regex.test(genre))) return 4;

      return 5;
    };

    movies.sort((a, b) => {
      const priorityDifference =
        getPriority(a) - getPriority(b);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return a.title.localeCompare(b.title);
    });

    res.status(200).json(movies.map(formatMovie));
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({
      message: 'Failed to search movies'
    });
  }
});

// GET /api/movies/:id - Get a single movie by its id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid movie id' });
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.status(200).json(formatMovie(movie));
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ message: 'Failed to fetch movie' });
  }
});

module.exports = router;
