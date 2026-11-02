const express = require('express');
const mongoose = require('mongoose');

const ReviewComment = require('../models/ReviewComment');
const WatchedMovie = require('../models/WatchedMovie');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/review-comments/watched-movie/:watchedMovieId
// Get all comments for a specific watched movie
router.get('/watched-movie/:watchedMovieId', async (req, res) => {
  try {
    const { watchedMovieId } = req.params;

    if (!mongoose.isValidObjectId(watchedMovieId)) {
      return res.status(400).json({
        message: 'Invalid watchedMovieId',
      });
    }

    const watchedMovieExists = await WatchedMovie.exists({
      _id: watchedMovieId,
    });

    if (!watchedMovieExists) {
      return res.status(404).json({
        message: 'Watched movie not found',
      });
    }

    const comments = await ReviewComment.find({
      watched_movie_id: watchedMovieId,
    })
      .populate('commenter_id', 'email')
      .sort({ createdAt: 1 });

    return res.status(200).json(comments);
  } catch (error) {
    console.error('Get review comments error:', error);
    return res.status(500).json({
      message: 'Server error',
    });
  }
});

// POST /api/review-comments/watched-movie/:watchedMovieId
// Create a comment for a specific watched movie
router.post(
  '/watched-movie/:watchedMovieId',
  authMiddleware,
  async (req, res) => {
    try {
      const { watchedMovieId } = req.params;
      const { comment } = req.body;
      const commenterId = req.user.userId;

      if (!mongoose.isValidObjectId(watchedMovieId)) {
        return res.status(400).json({
          message: 'Invalid watchedMovieId',
        });
      }

      if (!mongoose.isValidObjectId(commenterId)) {
        return res.status(400).json({
          message: 'Invalid user ID',
        });
      }

      if (typeof comment !== 'string' || !comment.trim()) {
        return res.status(400).json({
          message: 'Comment cannot be empty',
        });
      }

      if (comment.trim().length > 1000) {
        return res.status(400).json({
          message: 'Comment cannot exceed 1000 characters',
        });
      }

      const watchedMovieExists = await WatchedMovie.exists({
        _id: watchedMovieId,
      });

      if (!watchedMovieExists) {
        return res.status(404).json({
          message: 'Watched movie not found',
        });
      }

      const userExists = await User.exists({
        _id: commenterId,
      });

      if (!userExists) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      const newComment = await ReviewComment.create({
        watched_movie_id: watchedMovieId,
        commenter_id: commenterId,
        comment: comment.trim(),
      });

      const populatedComment = await ReviewComment.findById(newComment._id)
        .populate('commenter_id', 'email');

      return res.status(201).json(populatedComment);
    } catch (error) {
      if (
        error.name === 'ValidationError' ||
        error.name === 'CastError'
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      console.error('Create review comment error:', error);
      return res.status(500).json({
        message: 'Server error',
      });
    }
  }
);

module.exports = router;