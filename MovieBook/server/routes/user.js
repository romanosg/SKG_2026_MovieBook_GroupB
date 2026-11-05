
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const UserReview = require('../models/UserReview');
const WatchedMovie = require('../models/WatchedMovie');
const router = express.Router();

// Usernames are compared ignoring upper/lower case ("Anna" = "anna")
const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

// Calculate user's age in whole years
function calculateAge(dateOfBirth) {
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
        hideAboutMe: user.hideAboutMe,
        age: calculateAge(user.dateOfBirth), // the owner sees their age even when it is hidden from others
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
    const { photo, aboutMe, hideEmail, hideAge, hideAboutMe } = req.body;
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

    if (hideAboutMe !== undefined) {
      if (typeof hideAboutMe !== 'boolean') {
        return res.status(400).json({
          message: 'hideAboutMe must be true or false.',
        });
      }
      updates.hideAboutMe = hideAboutMe;
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
        hideAboutMe: user.hideAboutMe,
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
// GET /api/user/user-info?username=someone
router.get('/user-info', async (req, res) => {
  try {
    const { email, username } = req.query;

    // The profile is found by username or by email
    let filter;
    if (typeof username === 'string' && username.trim()) {
      filter = { username: username.trim() };
    } else if (typeof email === 'string' && email.trim()) {
      filter = { email: email.trim().toLowerCase() };
    } else {
      return res.status(400).json({
        message: 'Email or username is required.',
      });
    }

    const user = await User.findOne(filter)
      .collation(CASE_INSENSITIVE)
      .select('email username dateOfBirth photo aboutMe hideEmail hideAge hideAboutMe');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const publicUser = {
      username: user.username,
      photo: user.photo,
    };

    // What the user chose to hide is left out of the answer
    if (!user.hideAboutMe) {
      publicUser.aboutMe = user.aboutMe;
    }

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
