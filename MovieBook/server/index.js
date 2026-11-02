
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
console.log('Loaded user route from:', require.resolve('./routes/user'));
console.log('Export type:', typeof userRoutes);
console.log('Export value:', userRoutes);
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
  });
