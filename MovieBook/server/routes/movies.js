const express = require('express');
const router = express.Router();

const Movie = require('../models/Movie');
const UserReview = require('../models/UserReview'); // Make sure UserReview model is imported
const mongoose = require('mongoose');

// Helper to format movie and compute average rating from actual public user reviews
const formatMovie = async (movie) => {
  const data = movie.toObject ? movie.toObject() : movie;

  // Calculate average rating from public reviews for this movie
  try {
    const reviews = await UserReview.find({ movie_id: data._id, isPrivate: { $ne: true } });
    let computedRating = data.star_review || 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      computedRating = Number((sum / reviews.length).toFixed(1));
    }

    return {
      ...data,
      description: data.plot || data.description || '',
      rating: computedRating
    };
  } catch {
    return {
      ...data,
      description: data.plot || data.description || '',
      rating: data.star_review || 0
    };
  }
};

// GET /api/movies - Get all movies with computed ratings
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ title: 1 });
    const formattedMovies = await Promise.all(movies.map(formatMovie));

    res.status(200).json(formattedMovies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});

// GET /api/movies/search
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || req.query.title;

    if (typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        message: 'Please provide a search term'
      });
    }

    const searchTerm = query.trim();
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedTerm, 'i');

    const movies = await Movie.find({
      $or: [
        { title: regex },
        { plot: regex },
        { director: regex },
        { genre: regex }
      ]
    });

    const getPriority = (movie) => {
      if (regex.test(movie.title || '')) return 1;
      if (regex.test(movie.plot || '')) return 2;
      if (regex.test(movie.director || '')) return 3;
      const genres = Array.isArray(movie.genre) ? movie.genre : [movie.genre || ''];
      if (genres.some((genre) => regex.test(genre))) return 4;
      return 5;
    };

    movies.sort((a, b) => {
      const priorityDifference = getPriority(a) - getPriority(b);
      if (priorityDifference !== 0) return priorityDifference;
      return a.title.localeCompare(b.title);
    });

    const formattedMovies = await Promise.all(movies.map(formatMovie));
    res.status(200).json(formattedMovies);
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({
      message: 'Failed to search movies'
    });
  }
});
// GET /api/movies/featured - Get 4 movies with the most public reviews
router.get('/featured', async (req, res) => {
  try {
    const movies = await Movie.aggregate([
      {
        $lookup: {
          from: UserReview.collection.name,
          let: { movieId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$movie_id', '$$movieId'] },
                    { $eq: ['$isPrivate', false] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'reviewStats'
        }
      },
      {
        $addFields: {
          publicReviewCount: {
            $ifNull: [
              { $arrayElemAt: ['$reviewStats.count', 0] },
              0
            ]
          }
        }
      },
      {
        $sort: {
          publicReviewCount: -1,
          title: 1
        }
      },
      { $limit: 4 }
    ]);

    const formattedMovies = await Promise.all(
      movies.map(formatMovie)
    );

    res.status(200).json(formattedMovies);
  } catch (error) {
    console.error('Error fetching featured movies:', error);
    res.status(500).json({
      message: 'Failed to fetch featured movies'
    });
  }
});
// GET /api/movies/reviewed - Get all movies with public reviews
router.get('/reviewed', async (req, res) => {
  try {
    const movies = await Movie.aggregate([
      {
        $lookup: {
          from: UserReview.collection.name,
          let: { movieId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$movie_id', '$$movieId'] },
                    { $eq: ['$isPrivate', false] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'reviewStats'
        }
      },
      {
        $addFields: {
          publicReviewCount: {
            $ifNull: [
              { $arrayElemAt: ['$reviewStats.count', 0] },
              0
            ]
          }
        }
      },
      { $match: { publicReviewCount: { $gt: 0 } } },
      { $sort: { publicReviewCount: -1, title: 1 } }
    ]);

    const formattedMovies = await Promise.all(
      movies.map(formatMovie)
    );

    res.status(200).json(formattedMovies);
  } catch (error) {
    console.error('Error fetching reviewed movies:', error);
    res.status(500).json({
      message: 'Failed to fetch reviewed movies'
    });
  }
});

// GET /api/movies/:id
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

    const formatted = await formatMovie(movie);
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ message: 'Failed to fetch movie' });
  }
});

module.exports = router;