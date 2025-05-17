const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authenticate, requireRole } = require('../middleware/auth');

// Duyệt bài viết
router.put('/approve/:postId', authenticate, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.approved = true;
    await post.save();

    res.json({ message: 'Post approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
