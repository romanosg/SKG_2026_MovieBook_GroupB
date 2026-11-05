
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const reviewCommentRoutes = require('./routes/reviewComments');
const watchedMovieRoutes = require('./routes/watchedMovies');
const userReviewRoutes = require('./routes/userReviews');
const userRoutes = require('./routes/user');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection cache
const cached = global.mongoose || {
  conn: null,
  promise: null,
};

global.mongoose = cached;

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((mongooseInstance) => mongooseInstance)
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Connect to MongoDB before handling API requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/watched-movies', watchedMovieRoutes);
app.use('/api/user-reviews', userReviewRoutes);
app.use('/api/user', userRoutes);
app.use('/api/review-comments', reviewCommentRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Hello from your Node.js server with Express!');
});

// Export Express app for Vercel
module.exports = app;

// Start local server only during local development
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
