const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Follow hoặc unfollow user khác
router.post('/:userId/follow', authenticate, async (req, res) => {
  try {
    if (req.user._id.equals(req.params.userId)) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const userToFollow = await User.findById(req.params.userId);
    if (!userToFollow) return res.status(404).json({ message: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    

    const isFollowing = currentUser.following.includes(userToFollow._id);
    const action = isFollowing ? 'unfollowed' : 'followed';

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => !id.equals(userToFollow._id));
      userToFollow.followers = userToFollow.followers.filter(id => !id.equals(currentUser._id));
    } else {
      // Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
    }

    await currentUser.save();
    await userToFollow.save();

    // Emit realtime notification cho người được follow
    const io = req.app.get('io');
    if (io && !currentUser._id.equals(userToFollow._id)) {
      io.to(userToFollow._id.toString()).emit('notification', {
        type: 'follow',
        message: `${currentUser.email} ${action} you`,
        fromUserId: currentUser._id,
      });
    }


    res.json({ message: isFollowing ? 'Unfollowed' : 'Followed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
