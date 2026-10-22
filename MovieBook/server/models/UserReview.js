
const mongoose = require('mongoose');

const userReviewSchema = new mongoose.Schema(
  {
    movie_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    text: {
      type: String,
      trim: true,
      required: true,
      maxlength: 2000,
    },

    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },

    reviewDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ένας χρήστης μπορεί να έχει μία δημόσια και μία ιδιωτική
// κριτική για την ίδια ταινία.
userReviewSchema.index(
  { user_id: 1, movie_id: 1, isPrivate: 1 },
  { unique: true }
);

module.exports = mongoose.model('UserReview', userReviewSchema);
