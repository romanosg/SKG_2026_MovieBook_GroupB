
const express = require('express');
const router = express.Router();

const Movie = require('../models/Movie');

const mongoose = require('mongoose');

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

/* GET /api/movies/:id - Get a single movie by its id */
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

    res.status(200).json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ message: 'Failed to fetch movie' });
  }
});

module.exports = router;
