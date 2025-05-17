const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');


// GET /users - Danh sách user, có phân trang & tìm kiếm


router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {};
    if (q) {
      const regex = new RegExp(q, 'i');
      filter = {
        $or: [{ email: regex }],
      };
    }

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter, '-password').skip(skip).limit(limit);

    res.json({
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /users/:id - Xem chi tiết user
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /users - Tạo user mới (nếu admin muốn tạo user)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và password là bắt buộc' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email đã tồn tại' });

    const newUser = new User({ email, password, role: role || 'user' });
    await newUser.save();

    res.status(201).json({ message: 'User đã được tạo thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /users/:id - Cập nhật user (vd: đổi role)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });

    // Không cho admin tự thay đổi chính mình (nếu cần)
    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'Admin không thể thay đổi chính mình' });
    }

    if (role) user.role = role;
    await user.save();

    res.json({ message: 'User đã được cập nhật thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /users/:id - Xóa user
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin không thể xoá chính mình' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });

    await user.deleteOne();

    res.json({ message: 'User đã được xoá thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
