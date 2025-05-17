require('dotenv').config({
  path:
    process.env.NODE_ENV === 'test'
      ? '.env.test'
      : process.env.NODE_ENV === 'test_real'
      ? '.env.real'
      : '.env'
});

const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cors = require('cors');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // giới hạn 10 requests
  message: 'Too many login attempts. Try again in 15 minutes.',
});

const express = require('express');
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',  // cho phép domain frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // các phương thức được phép
  credentials: true, // nếu cần gửi cookie/token
}));


app.use(helmet());

app.use(express.json({ limit: '10kb' })); // hoặc lớn hơn tùy nhu cầu
// app.use(mongoSanitize());
// app.use(xss());
app.use(morgan('combined'));

app.use('/auth', authLimiter);
app.use('/auth', require('./routes/auth'));

app.use('/posts', require('./routes/posts'));
app.use('/posts', require('./routes/comments'));  // comments routes nằm dưới /posts
app.use('/users/admin', require('./routes/usersAdmin'));
app.use('/admin/posts', require('./routes/adminPosts'));
app.use('/users/follow', require('./routes/usersFollow'));
app.use('/moderation', require('./routes/moderation'));
app.use('/messages', require('./routes/messages'));
app.use('/users', require('./routes/users'));

module.exports = app;
