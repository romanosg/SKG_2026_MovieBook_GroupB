const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, age } = req.body;

    if (!email || !password || age === undefined || age === null || age === '') {
      return res.status(400).json({
        message: 'Email, password and age are required.',
      });
    }

    const parsedAge = Number(age);

    if (!Number.isFinite(parsedAge) || parsedAge < 0) {
      return res.status(400).json({
        message: 'Age must be a valid non-negative number.',
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
      age: parsedAge,
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        email: newUser.email,
        age: newUser.age,
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

    if (!email || !password) {
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

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user._id,
        email: user.email,
        age: user.age,
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