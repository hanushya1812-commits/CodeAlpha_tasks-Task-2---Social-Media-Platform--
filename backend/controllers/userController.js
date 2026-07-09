const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Get user profile by username and their posts
// @route   GET /api/users/profile/:username
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if current user is following this user
    const isFollowing = user.followers.includes(req.user.id);

    // Fetch user's posts
    const posts = await Post.find({ user: user._id })
      .populate('user', 'username avatar')
      .populate('comments')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      profile: {
        _id: user._id,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        createdAt: user.createdAt
      },
      posts
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile (bio, avatar)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { bio, avatar } = req.body;

    const fieldsToUpdate = {};
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    if (avatar !== undefined) fieldsToUpdate.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        followersCount: updatedUser.followers.length,
        followingCount: updatedUser.following.length
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Follow or Unfollow a user
// @route   POST /api/users/follow/:id
// @access  Private
exports.followUnfollowUser = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if trying to follow yourself
    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    let isFollowing = false;

    // Check if current user already follows target user
    if (userToFollow.followers.includes(currentUser._id)) {
      // Unfollow
      userToFollow.followers = userToFollow.followers.filter(
        (followerId) => followerId.toString() !== currentUser._id.toString()
      );
      currentUser.following = currentUser.following.filter(
        (followingId) => followingId.toString() !== userToFollow._id.toString()
      );
      isFollowing = false;
    } else {
      // Follow
      userToFollow.followers.push(currentUser._id);
      currentUser.following.push(userToFollow._id);
      isFollowing = true;
    }

    await userToFollow.save();
    await currentUser.save();

    res.status(200).json({
      success: true,
      isFollowing,
      followersCount: userToFollow.followers.length,
      followingCount: currentUser.following.length,
      message: isFollowing ? 'Successfully followed user' : 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
exports.getSuggestions = async (req, res, next) => {
  try {
    // Exclude current user and users already followed by current user
    const currentUser = await User.findById(req.user.id);
    const excludeIds = [currentUser._id, ...currentUser.following];

    const suggestedUsers = await User.find({ _id: { $nin: excludeIds } })
      .select('username bio avatar followers')
      .limit(5);

    res.status(200).json({
      success: true,
      suggestions: suggestedUsers.map((user) => ({
        _id: user._id,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        followersCount: user.followers.length
      }))
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
