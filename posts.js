const express = require('express');
const {
  createPost,
  getFeed,
  getExplore,
  deletePost,
  likePost
} = require('../controllers/postController');
const {
  addComment,
  getComments,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Post core routes
router.post('/', protect, createPost);
router.get('/feed', protect, getFeed);
router.get('/explore', protect, getExplore);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);

// Comments routes nested under posts
router.post('/:postId/comments', protect, addComment);
router.get('/:postId/comments', protect, getComments);
router.delete('/comments/:commentId', protect, deleteComment);

module.exports = router;
