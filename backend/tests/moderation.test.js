const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../app');
const User = require('../models/User');
const Post = require('../models/Post');

let mongoServer;
let userToken, moderatorToken, adminToken, postId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Tạo user thường
  const user = await User.create({ email: 'user@example.com', password: '123456', role: 'user' });
  userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret');

  // Tạo moderator
  const moderator = await User.create({ email: 'mod@example.com', password: '123456', role: 'moderator' });
  moderatorToken = jwt.sign({ id: moderator._id }, process.env.JWT_SECRET || 'testsecret');

  // Tạo admin
  const admin = await User.create({ email: 'admin@example.com', password: '123456', role: 'admin' });
  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'testsecret');

  // Tạo post chưa duyệt
  const post = await Post.create({
    title: 'Need Approval',
    content: 'Please approve this',
    author: user._id,
    approved: false,
  });
  postId = post._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('PUT /moderation/approve/:postId', () => {
  test('Moderator can approve post', async () => {
    const res = await request(app)
      .put(`/moderation/approve/${postId}`)
      .set('Authorization', `Bearer ${moderatorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Post approved');

    const updatedPost = await Post.findById(postId);
    expect(updatedPost.approved).toBe(true);
  });

  test('Admin can approve post', async () => {
    // Tạo bài viết khác để duyệt
    const newPost = await Post.create({
      title: 'Admin Approves',
      content: 'Approve this too',
      author: new mongoose.Types.ObjectId(),

      approved: false,
    });

    const res = await request(app)
      .put(`/moderation/approve/${newPost._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Post approved');
  });

  test('User cannot approve post', async () => {
    const res = await request(app)
      .put(`/moderation/approve/${postId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message');
  });

  test('Returns 404 for nonexistent post', async () => {
    const res = await request(app)
      .put('/moderation/approve/000000000000000000000000')
      .set('Authorization', `Bearer ${moderatorToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Post not found');
  });

  test('Returns 401 for unauthenticated request', async () => {
    const res = await request(app).put(`/moderation/approve/${postId}`);
    expect(res.statusCode).toBe(401);
  });
});
