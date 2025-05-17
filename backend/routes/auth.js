const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Đăng ký
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Register req body:', req.body);
    await User.create({ email, password });
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: err.message });
  }
});


// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    // Trả về token và user (chỉ gửi những trường cần thiết)
    res.json({
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        role: user.role || 'user'  // nếu bạn có role trong model
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id, '-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router;