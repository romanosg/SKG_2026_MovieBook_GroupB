
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
console.log('ENV file path:', require('path').join(__dirname, '.env'));
console.log('JWT_SECRET exists:', Object.hasOwn(process.env, 'JWT_SECRET'));
console.log('JWT_SECRET loaded in index:', Boolean(process.env.JWT_SECRET));
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test route
app.get('/', (req, res) => {
  res.send('Hello from your Node.js server with Express!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
