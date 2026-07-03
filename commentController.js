const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const comment = await Comment.create({
      content,
      post: req.params.postId,
      user: req.user.id
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar');

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Private
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username avatar')
      .sort({ createdAt: 1 }); // Oldest first for readability in threads

    res.status(200).json({ success: true, count: comments.length, comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate('post');

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // A comment can be deleted by either the comment author OR the post owner
    const isCommentAuthor = comment.user.toString() === req.user.id;
    const isPostOwner = comment.post.user.toString() === req.user.id;

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
