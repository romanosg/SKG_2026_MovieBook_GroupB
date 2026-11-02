
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const UserReview = require('../models/UserReview');
const WatchedMovie = require('../models/WatchedMovie');
const router = express.Router();
const mongoose = require('mongoose');
// Calculate user's age in whole years
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();

  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}

// GET /api/user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        dateOfBirth: user.dateOfBirth,
        photo: user.photo,
        aboutMe: user.aboutMe,
        hideEmail: user.hideEmail,
        hideAge: user.hideAge,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching the profile.',
    });
  }
});

// PUT /api/user/profile
// Update profile photo, about me and privacy settings
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { photo, aboutMe, hideEmail, hideAge } = req.body;
    const updates = {};

    if (photo !== undefined) {
      if (typeof photo !== 'string') {
        return res.status(400).json({
          message: 'Photo must be a string URL or path.',
        });
      }
      updates.photo = photo.trim();
    }

    if (aboutMe !== undefined) {
      if (typeof aboutMe !== 'string' || aboutMe.length > 500) {
        return res.status(400).json({
          message: 'About me must be text of at most 500 characters.',
        });
      }
      updates.aboutMe = aboutMe.trim();
    }

    if (hideEmail !== undefined) {
      if (typeof hideEmail !== 'boolean') {
        return res.status(400).json({
          message: 'hideEmail must be true or false.',
        });
      }
      updates.hideEmail = hideEmail;
    }

    if (hideAge !== undefined) {
      if (typeof hideAge !== 'boolean') {
        return res.status(400).json({
          message: 'hideAge must be true or false.',
        });
      }
      updates.hideAge = hideAge;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid profile fields provided.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        dateOfBirth: user.dateOfBirth,
        photo: user.photo,
        aboutMe: user.aboutMe,
        hideEmail: user.hideEmail,
        hideAge: user.hideAge,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      message: 'An error occurred while updating the profile.',
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
    }).select('email username dateOfBirth photo aboutMe hideEmail hideAge');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const publicUser = {
      username: user.username,
      photo: user.photo,
      aboutMe: user.aboutMe,
    };

    if (!user.hideEmail) {
      publicUser.email = user.email;
    }

    if (!user.hideAge) {
      publicUser.age = calculateAge(user.dateOfBirth);
    }

    return res.status(200).json({ user: publicUser });
  } catch (error) {
    console.error('User info error:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching the user.',
    });
  }
});
// GET /api/user/public/:userId
// View another user's public profile
router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: 'Invalid userId.',
      });
    }

    const user = await User.findById(userId).select(
      'email username dateOfBirth photo aboutMe hideEmail hideAge'
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    const publicUser = {
      id: user._id,
      username: user.username,
      photo: user.photo,
      aboutMe: user.aboutMe,
    };

    if (!user.hideEmail) {
      publicUser.email = user.email;
    }

    if (!user.hideAge) {
      publicUser.age = calculateAge(user.dateOfBirth);
    }

    return res.status(200).json({
      user: publicUser,
    });
  } catch (error) {
    console.error('Public profile error:', error);

    return res.status(500).json({
      message: 'An error occurred while fetching the user profile.',
    });
  }
});
// DELETE /api/user/account

router.delete('/account', authMiddleware, async (req, res) => {
  let session;

  try {
    session = await User.startSession();

    let deleted = false;
    const userId = req.user.userId;

    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);

      if (!user) {
        return;
      }

      await UserReview.deleteMany(
        { user_id: userId },
        { session }
      );

      await WatchedMovie.deleteMany(
        { user_id: userId },
        { session }
      );

      await User.deleteOne(
        { _id: userId },
        { session }
      );

      deleted = true;
    });

    if (!deleted) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      message: 'Account and related data deleted successfully.',
    });
  } catch (error) {
    console.error('Account deletion error:', error);

    return res.status(500).json({
      message: 'An error occurred while deleting the account.',
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});




module.exports = router;
