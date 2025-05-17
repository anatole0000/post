const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Post = require('../models/Post');

let mongoServer;
let userToken, adminToken;
let userId, postId, commentId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Tạo user thường
  const user = await User.create({ email: 'user@example.com', password: '123456', role: 'user' });
  userId = user._id;
  userToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret');

  // Tạo admin
  const admin = await User.create({ email: 'admin@example.com', password: '123456', role: 'admin' });
  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'testsecret');

  // Tạo bài viết
  const post = await Post.create({
    title: 'Post for comment test',
    content: 'Content',
    author: userId,
    comments: []
  });
  postId = post._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /posts/:postId/comments', () => {
  test('User can add a comment', async () => {
    const res = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'This is a comment' });

    expect(res.statusCode).toBe(201);
    expect(res.body.comments.length).toBeGreaterThan(0);
    commentId = res.body.comments[0]._id;
  });

  test('Cannot comment without content', async () => {
    const res = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /posts/:postId/comments', () => {
  test('Anyone can get comments of a post', async () => {
    const res = await request(app).get(`/posts/${postId}/comments`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('PUT /posts/:postId/comments/:commentId', () => {
  test('Author can edit their comment', async () => {
    const res = await request(app)
      .put(`/posts/${postId}/comments/${commentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Updated comment' });

    expect(res.statusCode).toBe(200);
    expect(res.body.comment.content).toBe('Updated comment');
  });

  test('Other users cannot edit the comment', async () => {
    const other = await User.create({ email: 'other@example.com', password: '111111' });
    const otherToken = jwt.sign({ id: other._id }, process.env.JWT_SECRET || 'testsecret');

    const res = await request(app)
      .put(`/posts/${postId}/comments/${commentId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'Hacked' });

    expect(res.statusCode).toBe(403);
  });
});

describe('DELETE /posts/:postId/comments/:commentId', () => {
  test('Admin can delete any comment', async () => {
    const res = await request(app)
      .delete(`/posts/${postId}/comments/${commentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Comment deleted');
  });

  test('Deleting non-existent comment returns 404', async () => {
    const res = await request(app)
      .delete(`/posts/${postId}/comments/000000000000000000000000`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});
