
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, dateOfBirth } = req.body;

    if (
      typeof email !== 'string' ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof dateOfBirth !== 'string' ||
      !email.trim() ||
      !username.trim() ||
      !password ||
      !dateOfBirth.trim()
    ) {
      return res.status(400).json({
        message: 'Email, username, password and date of birth are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      return res.status(400).json({
        message: 'Username must be between 3 and 30 characters.',
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

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({
          message: 'This email is already registered.',
        });
      }

      return res.status(409).json({
        message: 'This username is already taken.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
      dateOfBirth: parsedDateOfBirth,
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        dateOfBirth: newUser.dateOfBirth,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        message:
          duplicateField === 'username'
            ? 'This username is already taken.'
            : 'This email is already registered.',
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
        username: user.username,
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

module.exports = router;
