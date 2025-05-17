const express = require('express');
const router = express.Router();

const Post = require('../models/Post');
const { authenticate, requireRole } = require('../middleware/auth');


// Lấy danh sách bài viết (có thể phân trang, tìm kiếm)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'email role'); // nếu có trường author liên kết user

    res.json({
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Tìm kiếm nâng cao và lọc bài viết
// GET /posts/search?keyword=abc&author=userid&category=tech&status=published&from=2024-01-01&to=2024-12-31
router.get('/search', async (req, res) => {
  try {
    const { keyword, author, category, status, from, to, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Tìm theo từ khóa
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (author) filter.author = author;
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('author', 'email role');

    res.json({
      posts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Tạo bài viết mới (phải đăng nhập)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Missing title or content' });

    const post = new Post({
      title,
      content,
      author: req.user._id,
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lấy chi tiết bài viết theo id
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'email role');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Đặt trước route '/:id'
router.put('/edit/:postId', authenticate, requireRole('editor', 'admin'), async (req, res) => {
  const { title, content } = req.body;
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.title = title || post.title;
    post.content = content || post.content;
    post.approved = false;

    await post.save();

    res.json({ message: 'Post edited, pending approval' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Cập nhật bài viết (chỉ tác giả hoặc admin mới được)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Kiểm tra quyền: là tác giả hoặc admin
    if (!post.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { title, content } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Xóa bài viết (chỉ tác giả hoặc admin)
// DELETE post
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isAdmin = req.user.role === 'admin';
    const isAuthor = post.author.equals(req.user._id);

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Forbidden: Cannot delete this post' });
    }

    await post.deleteOne(); // ✅ Sửa lỗi từ post.remove()
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Thêm bình luận cho bài viết (phải đăng nhập)
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Missing comment content' });

    post.comments.push({
      content,
      author: req.user._id,
      createdAt: new Date(),
    });

    await post.save();

    // Populate để trả về comment đầy đủ thông tin author
    await post.populate({
      path: 'comments.author',
      select: 'email role',
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like bài viết
router.post('/:postId/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id;
    let action = '';

    if (post.likes.includes(userId)) {
      // User đã like rồi, bỏ like
      post.likes = post.likes.filter(id => !id.equals(userId));
      action = 'unliked';
    } else {
      // Thêm like
      post.likes.push(userId);
      action = 'liked';
    }

    await post.save();

    // Gửi notification realtime cho author bài viết nếu người like khác author
    const io = req.app.get('io');
    if (!userId.equals(post.author._id)) {
      io.to(post.author._id.toString()).emit('notification', {
        type: 'like',
        message: `${req.user.email} ${action} your post: "${post.title}"`,
        postId: post._id,
        fromUserId: userId,
      });
    }

    res.json({ message: 'Like status updated', likesCount: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
