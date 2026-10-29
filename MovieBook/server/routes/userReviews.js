
const express = require('express');
const mongoose = require('mongoose');
const UserReview = require('../models/UserReview');
const User = require('../models/User');
const Movie = require('../models/Movie');
const authMiddleware = require('../middleware/authMiddleware');
const updateMovieRating = require('../utils/updateMovieRating');

const router = express.Router();

// POST /api/user-reviews
// Δημιουργία δημόσιας ή ιδιωτικής κριτικής
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Το user_id προέρχεται από το επαληθευμένο JWT, όχι από το body.
    const user_id = req.user.userId;
    const { movie_id, isPrivate, text, rating, reviewDate } = req.body;

    if (!mongoose.isValidObjectId(movie_id)) {
      return res.status(400).json({ message: 'Invalid movie_id' });
    }

    if (typeof isPrivate !== 'boolean') {
      return res.status(400).json({
        message: 'isPrivate must be true or false',
      });
    }

    if (
      typeof text !== 'string' ||
      !text.trim() ||
      text.length > 2000
    ) {
      return res.status(400).json({
        message: 'Text is required and must not exceed 2000 characters',
      });
    }

    if (
      rating === undefined ||
      rating === null ||
      rating === '' ||
      !Number.isFinite(Number(rating)) ||
      Number(rating) < 0 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        message: 'Rating must be a number between 0 and 5',
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

    const review = await UserReview.create({
      user_id,
      movie_id,
      isPrivate,
      text: text.trim(),
      rating: Number(rating),
      ...(reviewDate ? { reviewDate } : {}),
    });

    await updateMovieRating(movie_id);

    return res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          'This user already has a review of this privacy type for this movie.',
      });
    }

    if (
      error.name === 'ValidationError' ||
      error.name === 'CastError'
    ) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Create user review error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user-reviews/check?movie_id=...&isPrivate=true
// Έλεγχος αν ο συνδεδεμένος χρήστης έχει ήδη τέτοια κριτική
router.get('/check', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { movie_id, isPrivate } = req.query;

    if (!mongoose.isValidObjectId(movie_id)) {
      return res.status(400).json({ message: 'Invalid movie_id' });
    }

    if (isPrivate !== 'true' && isPrivate !== 'false') {
      return res.status(400).json({
        message: 'isPrivate must be true or false',
      });
    }

    const review = await UserReview.findOne({
      user_id,
      movie_id,
      isPrivate: isPrivate === 'true',
    });

    return res.status(200).json({
      exists: Boolean(review),
      review,
    });
  } catch (error) {
    console.error('Check user review error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user-reviews/public
// Εμφάνιση μόνο δημόσιων κριτικών
router.get('/public', async (req, res) => {
  try {
    const reviews = await UserReview.find({ isPrivate: false })
      .populate('user_id', 'email')
      .populate('movie_id')
      .sort({ reviewDate: -1 });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Get public reviews error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user-reviews/private
// Εμφάνιση μόνο των ιδιωτικών κριτικών του συνδεδεμένου χρήστη
router.get('/private', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const reviews = await UserReview.find({
      user_id,
      isPrivate: true,
    })
      .populate('movie_id')
      .sort({ reviewDate: -1 });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Get private reviews error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user-reviews/:reviewId
// Ενημέρωση μόνο από τον ιδιοκτήτη της κριτικής
router.put('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const user_id = req.user.userId;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ message: 'Invalid reviewId' });
    }

    const existingReview = await UserReview.findById(reviewId);

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (existingReview.user_id.toString() !== user_id) {
      return res.status(403).json({
        message: 'You are not allowed to edit this review',
      });
    }

    const updates = {};
    const { text, rating, isPrivate } = req.body;

    if (text !== undefined) {
      if (
        typeof text !== 'string' ||
        !text.trim() ||
        text.length > 2000
      ) {
        return res.status(400).json({
          message: 'Text is required and must not exceed 2000 characters',
        });
      }

      updates.text = text.trim();
    }

    if (rating !== undefined) {
      if (
        rating === null ||
        rating === '' ||
        !Number.isFinite(Number(rating)) ||
        Number(rating) < 0 ||
        Number(rating) > 5
      ) {
        return res.status(400).json({
          message: 'Rating must be a number between 0 and 5',
        });
      }

      updates.rating = Number(rating);
    }

    if (isPrivate !== undefined) {
      if (typeof isPrivate !== 'boolean') {
        return res.status(400).json({
          message: 'isPrivate must be true or false',
        });
      }

      updates.isPrivate = isPrivate;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields provided to update',
      });
    }

    const review = await UserReview.findByIdAndUpdate(
      reviewId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await updateMovieRating(review.movie_id);

    return res.status(200).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          'A review of this privacy type already exists for this movie.',
      });
    }

    if (
      error.name === 'ValidationError' ||
      error.name === 'CastError'
    ) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Update user review error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/user-reviews/:reviewId
// Διαγραφή μόνο από τον ιδιοκτήτη της κριτικής
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const user_id = req.user.userId;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ message: 'Invalid reviewId' });
    }

    const existingReview = await UserReview.findById(reviewId);

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (existingReview.user_id.toString() !== user_id) {
      return res.status(403).json({
        message: 'You are not allowed to delete this review',
      });
    }

    await UserReview.findByIdAndDelete(reviewId);
    await updateMovieRating(existingReview.movie_id);

    return res.status(200).json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete user review error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
