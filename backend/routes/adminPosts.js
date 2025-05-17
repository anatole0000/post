const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Admin xóa bài viết theo ID
router.delete('/:postId', authenticate, requireAdmin, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// (Tuỳ chọn) Admin có thể lấy tất cả bài viết với phân trang
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      totalPosts,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// (Tuỳ chọn) Admin chỉnh sửa bài viết
router.put('/:postId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.title = title || post.title;
    post.content = content || post.content;

    await post.save();

    res.json({ message: 'Post updated', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
