const mongoose = require('mongoose');

const reviewCommentSchema = new mongoose.Schema(
  {
    watched_movie_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WatchedMovie',
      required: true,
    },

    commenter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ReviewComment', reviewCommentSchema);