const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');

// Gửi tin nhắn
router.post('/', authenticate, async (req, res) => {
  const { recipient, content } = req.body;
  if (!recipient || !content) return res.status(400).json({ message: 'Missing fields' });

  const message = new Message({
    sender: req.user._id,
    recipient,
    content,
  });

  await message.save();
  res.status(201).json(message);
});

// Lấy tin nhắn giữa 2 người
router.get('/:userId', authenticate, async (req, res) => {
  const otherUserId = req.params.userId;

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, recipient: otherUserId },
      { sender: otherUserId, recipient: req.user._id }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
});

module.exports = router;
