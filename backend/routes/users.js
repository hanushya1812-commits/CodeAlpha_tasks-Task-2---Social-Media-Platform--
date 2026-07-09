const express = require('express');
const {
  getUserProfile,
  updateProfile,
  followUnfollowUser,
  getSuggestions
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile/:username', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/follow/:id', protect, followUnfollowUser);
router.get('/suggestions', protect, getSuggestions);

module.exports = router;
