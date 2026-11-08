
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Usernames and emails are compared ignoring upper/lower case ("Anna" = "anna")
const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

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

    if (!/^[A-Za-z][A-Za-z0-9_]{2,29}$/.test(normalizedUsername)) {
  return res.status(400).json({
    message:
      'Username must be 3–30 characters, start with a letter, and use only letters, numbers or underscores.',
  });
}

    const parsedDateOfBirth = new Date(dateOfBirth);

if (Number.isNaN(parsedDateOfBirth.getTime())) {
  return res.status(400).json({
    message: 'Date of birth must be a valid date.',
  });
}

const today = new Date();

let age = today.getFullYear() - parsedDateOfBirth.getFullYear();

if (
  today.getMonth() < parsedDateOfBirth.getMonth() ||
  (today.getMonth() === parsedDateOfBirth.getMonth() &&
    today.getDate() < parsedDateOfBirth.getDate())
) {
  age--;
}

if (age < 13 || age > 120) {
  return res.status(400).json({
    message: 'You must be between 13 and 120 years old.',
  });
}

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    }).collation(CASE_INSENSITIVE);

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
if (
  password.length < 7 ||
  !/[A-Z]/.test(password) ||
  !/[0-9]|[^A-Za-z0-9\s]/.test(password)
) {
  return res.status(400).json({
    message: 'Password does not meet the requirements.',
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
    // identifier mporei na einai email h username
    const { identifier, email: emailField, password } = req.body;
    const raw = (identifier ?? emailField ?? '').trim();

    if (!raw || typeof password !== 'string' || !password) {
      return res.status(400).json({
        message: 'Email/username and password are required.',
      });
    }

    // an periexei @ to theloume ws email, alliws ws username
    const isEmail = raw.includes('@');
    const user = await User.findOne(
      isEmail ? { email: raw.toLowerCase() } : { username: raw }
    ).collation(CASE_INSENSITIVE);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email/username or password.',
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
