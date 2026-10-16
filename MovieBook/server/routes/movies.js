
const express = require('express');
const router = express.Router();

const Movie = require('../models/Movie');

// GET /api/movies - Get all movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ title: 1 });
    res.status(200).json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});

/* GET /api/movies/search?title=dark - Search movies by title */
router.get('/search', async (req, res) => {
  try {
    const title = req.query.title;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Please provide a movie title to search'
      });
    }

    const movies = await Movie.find({
      title: { $regex: title.trim(), $options: 'i' }
    }).sort({ title: 1 });

    res.status(200).json(movies);
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({
      message: 'Failed to search movies'
    });
  }
});

module.exports = router;
