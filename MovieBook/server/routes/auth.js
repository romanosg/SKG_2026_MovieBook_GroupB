
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, dateOfBirth } = req.body;

if (
  typeof email !== 'string' ||
  typeof password !== 'string' ||
  typeof dateOfBirth !== 'string' ||
  !email.trim() ||
  !password ||
  !dateOfBirth.trim()
) {
  return res.status(400).json({
    message: 'Email, password and date of birth are required.',
  });
}
    const parsedDateOfBirth = new Date(dateOfBirth);

    if (
      Number.isNaN(parsedDateOfBirth.getTime()) ||
      parsedDateOfBirth > new Date()
    ) {
      return res.status(400).json({
        message: 'Date of birth must be a valid date in the past.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'This email is already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: normalizedEmail,
      password: hashedPassword,
      dateOfBirth: parsedDateOfBirth,
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        email: newUser.email,
        dateOfBirth: newUser.dateOfBirth,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This email is already registered.',
      });
    }

    console.error('Register error:', error);

    return res.status(500).json({
      message: 'An error occurred during registration.',
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

if (
  typeof email !== 'string' ||
  typeof password !== 'string' ||
  !email.trim() ||
  !password
) {
  return res.status(400).json({
    message: 'Email and password are required.',
  });
}

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }
    
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
    return res.status(200).json({
  message: 'Login successful.',
  token,
  user: {
    id: user._id,
    email: user.email,
    dateOfBirth: user.dateOfBirth,
  },
});
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'An error occurred during login.',
    });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication token is required.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');

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
    return res.status(401).json({
      message: 'Invalid or expired authentication token.',
    });
  }
});

// Calculating user's age in whole years, using today's date in GMT+3
function calculateAge(dateOfBirth) {
  const nowGmt3 = new Date(Date.now() + 3 * 60 * 60 * 1000);
  let age = nowGmt3.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = nowGmt3.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && nowGmt3.getUTCDate() < dateOfBirth.getUTCDate())
  ) {
    age--;
  }
  return age;
}

// GET /api/auth/user-info?email=someone@example.com - public info for a profile page
router.get('/user-info', async (req, res) => {
  try {
    const { email } = req.query;

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('email dateOfBirth');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
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

module.exports = router;
