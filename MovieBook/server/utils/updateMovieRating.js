
const UserReview = require('../models/UserReview');
const Movie = require('../models/Movie');
const mongoose = require('mongoose');

async function updateMovieRating(movieId) {
  const objectId = new mongoose.Types.ObjectId(movieId.toString());

  const result = await UserReview.aggregate([
    {
      $match: {
        movie_id: objectId,
        isPrivate: false,
      },
    },
    {
      $group: {
        _id: '$movie_id',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  const averageRating =
    result.length > 0 ? result[0].averageRating : 0;

  const starReview = Math.round(averageRating);

  await Movie.findByIdAndUpdate(movieId, {
    star_review: starReview,
  });

  return starReview;
}

module.exports = updateMovieRating;
