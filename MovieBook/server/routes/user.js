
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Calculating user's age in whole years
function calculateAge(dateOfBirth) {
  const nowGmt3 = new Date(Date.now() + 3 * 60 * 60 * 1000);

  let age =
    nowGmt3.getUTCFullYear() - dateOfBirth.getUTCFullYear();

  const monthDiff =
    nowGmt3.getUTCMonth() - dateOfBirth.getUTCMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      nowGmt3.getUTCDate() < dateOfBirth.getUTCDate())
  ) {
    age--;
  }

  return age;
}

// GET /api/user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);

    return res.status(500).json({
      message: 'An error occurred while fetching the profile.',
    });
  }
});

// GET /api/user/user-info?email=someone@example.com
router.get('/user-info', async (req, res) => {
  try {
    const { email } = req.query;

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        message: 'Email is required.',
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('email dateOfBirth');

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      user: {
        email: user.email,
        age: calculateAge(user.dateOfBirth),
      },
    });
  } catch (error) {
    console.error('User info error:', error);

    return res.status(500).json({
      message: 'An error occurred while fetching the user.',
    });
  }
});
console.log('USER ROUTES FILE REACHED END');
console.log('Router type:', typeof router);
module.exports = router;
