const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content cannot be empty'],
    maxlength: [500, 'Post content cannot exceed 500 characters'],
    trim: true
  },
  image: {
    type: String,
    default: '' // Optional external image URL
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for comments count to avoid loading all comments when not needed
PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true
});

module.exports = mongoose.model('Post', PostSchema);
