
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Movie = require('./models/Movie');

async function seedMovies() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const datasetPath = path.join(__dirname, 'movies_dataset.json');
    const moviesData = JSON.parse(
      fs.readFileSync(datasetPath, 'utf8')
    );

    let added = 0;
    let updated = 0;
    let unchanged = 0;

    for (const movieData of moviesData) {
  const { description, ...movieFields } = movieData;

  const movieToSave = {
    ...movieFields,
    plot: movieData.plot || description || '',
  };

  const result = await Movie.updateOne(
    {
      title: movieToSave.title,
      year: movieToSave.year,
    },
    {
      $setOnInsert: movieToSave,
    },
    { upsert: true }
  );

      if (result.upsertedCount > 0) {
        console.log(`Added: ${movieData.title}`);
        added++;
      } else if (result.modifiedCount > 0) {
        console.log(`Updated: ${movieData.title}`);
        updated++;
      } else {
        console.log(`Unchanged: ${movieData.title}`);
        unchanged++;
      }
    }

    console.log(`Finished. Added: ${added}, Updated: ${updated}, Unchanged: ${unchanged}`);
  } catch (error) {
    console.error('Error seeding movies:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedMovies();
