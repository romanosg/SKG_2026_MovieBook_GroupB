const express = require('express');
const mongoose = require('mongoose');
const WatchedMovie = require('../models/WatchedMovie');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Movie = require('../models/Movie');

const router = express.Router();

// POST /api/watched-movies
// Καταχώριση ταινίας που παρακολούθησε ο χρήστης
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { movie_id, rating, review, watchedAt } = req.body;
    const user_id = req.user.userId;

    if (!mongoose.isValidObjectId(user_id)) {
      return res.status(400).json({ message: 'Invalid user_id' });
    }

    if (!mongoose.isValidObjectId(movie_id)) {
      return res.status(400).json({ message: 'Invalid movie_id' });
    }

    if (
      rating !== undefined &&
      rating !== null &&
      rating !== '' &&
      (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)
    ) {
      return res.status(400).json({
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    if (review !== undefined && typeof review !== 'string') {
      return res.status(400).json({ message: 'Review must be a string' });
    }

    if (typeof review === 'string' && review.length > 1000) {
      return res.status(400).json({
        message: 'Review cannot exceed 1000 characters',
      });
    }

    const userExists = await User.exists({ _id: user_id });
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const movieExists = await Movie.exists({ _id: movie_id });
    if (!movieExists) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const existingEntry = await WatchedMovie.findOne({ user_id, movie_id });
    if (existingEntry) {
      return res.status(200).json(existingEntry);
    }

    const watchedMovie = await WatchedMovie.create({
      user_id,
      movie_id,
      ...(rating !== undefined && rating !== null && rating !== ''
        ? { rating: Number(rating) }
        : {}),
      review: review || '',
      ...(watchedAt ? { watchedAt } : {}),
    });

    return res.status(201).json(watchedMovie);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Create watched movie error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/watched-movies/username/:username
// Λήψη όλων των καταχωρίσεων ενός χρήστη βάσει username
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const watchedMovies = await WatchedMovie.find({ user_id: user._id })
      .populate('movie_id')
      .sort({ watchedAt: -1 });

    return res.status(200).json(watchedMovies);
  } catch (error) {
    console.error('Get watched movies by username error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/watched-movies/user/:userId
// Λήψη όλων των καταχωρίσεων ενός χρήστη
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const watchedMovies = await WatchedMovie.find({ user_id: userId })
      .populate('movie_id')
      .sort({ watchedAt: -1 });

    return res.status(200).json(watchedMovies);
  } catch (error) {
    console.error('Get watched movies error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const watchedMovies = await WatchedMovie.find()
      .populate('movie_id')
      .populate('user_id', 'email')
      .sort({ createdAt: -1 });

    return res.status(200).json(watchedMovies);
  } catch (error) {
    console.error('Get all watched movies error:', error);
    return res.status(500).json({
      message: 'Server error',
    });
  }
});

router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({
        message: 'Invalid movieId',
      });
    }

    const movieExists = await Movie.exists({ _id: movieId });

    if (!movieExists) {
      return res.status(404).json({
        message: 'Movie not found',
      });
    }

    const watchedMovies = await WatchedMovie.find({
      movie_id: movieId,
    })
      .populate('movie_id')
      .populate('user_id', 'email')
      .sort({ createdAt: -1 });

    return res.status(200).json(watchedMovies);
  } catch (error) {
    console.error('Get watched movies by movie error:', error);

    return res.status(500).json({
      message: 'Server error',
    });
  }
});

module.exports = router;