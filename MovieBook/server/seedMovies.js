
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Movie = require('./models/Movie');

async function seedMovies() {
  try {
    // Use the same MongoDB connection variable as server/index.js
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const datasetPath = path.join(__dirname, 'movies_dataset.json');
    const moviesData = JSON.parse(
      fs.readFileSync(datasetPath, 'utf8')
    );

    // Add only movies that do not already exist by title
    let added = 0;

    for (const movieData of moviesData) {
      const exists = await Movie.findOne({ title: movieData.title });

      if (!exists) {
        await Movie.create(movieData);
        console.log(`Added: ${movieData.title}`);
        added++;
      } else {
        console.log(`Already exists: ${movieData.title}`);
      }
    }

    console.log(`Finished. Added ${added} new movies.`);
  } catch (error) {
    console.error('Error seeding movies:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedMovies();
