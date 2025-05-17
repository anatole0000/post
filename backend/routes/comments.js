const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authenticate } = require('../middleware/auth');

// Thêm bình luận vào một bài viết
router.post('/:postId/comments', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Missing comment content' });

    const comment = {
      content,
      author: req.user._id,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    // Lấy io từ app
    const io = req.app.get('io');
    // Gửi sự kiện realtime tới tất cả client hoặc client cụ thể
    io.emit('new_comment', { 
      postId: post._id.toString(),
      comment: comment,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sửa bình luận (chỉ author hoặc admin)
router.put('/:postId/comments/:commentId', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (!comment.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    comment.content = req.body.content || comment.content;
    await post.save();

    res.json({ message: 'Comment updated', comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Xoá bình luận (chỉ author hoặc admin)
router.delete('/:postId/comments/:commentId', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (!comment.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    post.comments.pull(comment._id); 
    await post.save();

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// (Tuỳ chọn) Lấy tất cả bình luận của một bài viết
router.get('/:postId/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate('comments.author', 'email');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json(post.comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
