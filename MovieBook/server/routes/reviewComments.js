const express = require('express');
const mongoose = require('mongoose');

const ReviewComment = require('../models/ReviewComment');
const UserReview = require('../models/UserReview');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/review-comments/review/:reviewId
router.get('/review/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ message: 'Invalid reviewId' });
    }

    const reviewExists = await UserReview.exists({ _id: reviewId });
    if (!reviewExists) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const comments = await ReviewComment.find({ review_id: reviewId })
      .populate('commenter_id', 'username email')
      .sort({ createdAt: 1 });

    return res.status(200).json(comments);
  } catch (error) {
    console.error('Get review comments error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/review-comments/review/:reviewId
router.post('/review/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const commenterId = req.user.userId;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ message: 'Invalid reviewId' });
    }

    if (typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' });
    }

    const reviewExists = await UserReview.exists({ _id: reviewId });
    if (!reviewExists) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const newComment = await ReviewComment.create({
      review_id: reviewId,
      commenter_id: commenterId,
      comment: comment.trim(),
    });

    const populatedComment = await ReviewComment.findById(newComment._id)
      .populate('commenter_id', 'username email');

    return res.status(201).json(populatedComment);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Create review comment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/review-comments/:commentId
// Edit comment by owner, sets isEdited flag without changing createdAt
router.put('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const commenterId = req.user.userId;
    const { comment } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: 'Invalid commentId' });
    }

    const existingComment = await ReviewComment.findById(commentId);
    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (existingComment.commenter_id.toString() !== commenterId) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    if (typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' });
    }

    const updated = await ReviewComment.findByIdAndUpdate(
      commentId,
      { $set: { comment: comment.trim(), isEdited: true } },
      { new: true, runValidators: true }
    ).populate('commenter_id', 'username email');

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update review comment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/review-comments/:commentId
// Delete comment by owner
router.delete('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const commenterId = req.user.userId;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: 'Invalid commentId' });
    }

    const existingComment = await ReviewComment.findById(commentId);
    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (existingComment.commenter_id.toString() !== commenterId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await ReviewComment.findByIdAndDelete(commentId);

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete review comment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;