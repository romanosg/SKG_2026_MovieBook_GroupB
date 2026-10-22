
require('dotenv').config({
  path: require('path').join(__dirname, '.env'),
});

console.log('ENV file path:', require('path').join(__dirname, '.env'));
console.log('JWT_SECRET exists:', Object.hasOwn(process.env, 'JWT_SECRET'));
console.log('JWT_SECRET loaded in index:', Boolean(process.env.JWT_SECRET));

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const watchedMovieRoutes = require('./routes/watchedMovies');
const userReviewRoutes = require('./routes/userReviews');

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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Test route
app.get('/', (req, res) => {
  res.send('Hello from your Node.js server with Express!');
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
