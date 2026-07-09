const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { content, image } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Post content cannot be empty' });
    }

    const post = await Post.create({
      content,
      image: image || '',
      user: req.user.id
    });

    const populatedPost = await Post.findById(post._id)
      .populate('user', 'username avatar')
      .populate('comments');

    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get posts feed (followed users + own posts)
// @route   GET /api/posts/feed
// @access  Private
exports.getFeed = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // We want to fetch posts where post.user is in [currentUser._id, ...currentUser.following]
    const userIds = [currentUser._id, ...currentUser.following];

    let posts = await Post.find({ user: { $in: userIds } })
      .populate('user', 'username avatar')
      .populate('comments')
      .sort({ createdAt: -1 });

    // Fallback: If feed is empty, show general explore feed so the UI isn't completely empty
    if (posts.length === 0) {
      posts = await Post.find()
        .populate('user', 'username avatar')
        .populate('comments')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.status(200).json({ success: true, count: posts.length, posts });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all posts (Explore)
// @route   GET /api/posts/explore
// @access  Private
exports.getExplore = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username avatar')
      .populate('comments')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: posts.length, posts });
  } catch (error) {
    console.error('Get explore error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Verify owner
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this post' });
    }

    // Delete post (Comment deletions will follow standard mongo lookup or be left alone, but let's delete associated comments too)
    await Post.findByIdAndDelete(req.params.id);
    
    // Delete associated comments
    const Comment = require('../models/Comment');
    await Comment.deleteMany({ post: req.params.id });

    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like / Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let isLiked = false;

    // Check if post is already liked by current user
    if (post.likes.includes(req.user.id)) {
      // Unlike
      post.likes = post.likes.filter((userId) => userId.toString() !== req.user.id);
      isLiked = false;
    } else {
      // Like
      post.likes.push(req.user.id);
      isLiked = true;
    }

    await post.save();

    res.status(200).json({
      success: true,
      isLiked,
      likesCount: post.likes.length,
      likes: post.likes
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
