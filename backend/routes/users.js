// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// GET /users - lấy danh sách người dùng
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await User.find({}, '_id name email role followers following');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users/:id/follow - follow hoặc unfollow người dùng
router.post('/:id/follow', authenticate, async (req, res) => {
  try {
    const userIdToFollow = req.params.id;
    const currentUserId = req.user._id; // từ middleware authenticate lấy userId

    if (userIdToFollow === currentUserId.toString()) {
      return res.status(400).json({ message: 'Không thể follow chính mình' });
    }

    const currentUser = await User.findById(currentUserId);
    const userToFollow = await User.findById(userIdToFollow);

    if (!userToFollow) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const isFollowing = currentUser.following.includes(userIdToFollow);

    if (isFollowing) {
      // unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== userIdToFollow);
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUserId.toString());
      await currentUser.save();
      await userToFollow.save();
      return res.json({ message: 'Đã unfollow người dùng' });
    } else {
      // follow
      currentUser.following.push(userIdToFollow);
      userToFollow.followers.push(currentUserId);
      await currentUser.save();
      await userToFollow.save();
      return res.json({ message: 'Đã follow người dùng' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
