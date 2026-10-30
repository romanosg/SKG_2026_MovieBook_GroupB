const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
  type: String,
  required: true,
  trim: true
},
    year: {
      type: Number,
      required: true,
    },
    genre: {
      type: [String],
      required: true,
    },
    director: {
      type: String,
      required: true,
    },
    actors: {
      type: [String],
      required: true,
    },
    plot: {
      type: String,
      required: true,
    },
    poster_url: {
      type: String,
      default: '',
    },
    star_review: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'star_review must be an integer',
      },
    },
  },
  {
    timestamps: true,
  }
);
movieSchema.index({ title: 1, year: 1 }, { unique: true });
module.exports = mongoose.model('Movie', movieSchema);
