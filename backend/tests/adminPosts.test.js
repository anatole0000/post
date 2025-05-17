const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Post = require('../models/Post');

let mongoServer;
let adminToken;
let userToken;
let postId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Tạo admin
  const admin = await User.create({
    email: 'admin@example.com',
    password: '123456',
    role: 'admin',
  });
  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'testsecret');

  // Tạo user thường
  const user = await User.create({
    email: 'user@example.com',
    password: '123456',
    role: 'user',
  });
  userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret');

  // Tạo 1 bài viết của user
  const post = await Post.create({
    title: 'Test post',
    content: 'Test content',
    author: user._id,
  });
  postId = post._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Admin Post Routes', () => {
  test('Admin can get paginated list of posts', async () => {
    const res = await request(app)
      .get('/admin/posts?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
    expect(res.body.currentPage).toBe(1);
    expect(res.body.totalPosts).toBeGreaterThanOrEqual(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  test('Admin can update a post', async () => {
    const res = await request(app)
      .put(`/admin/posts/${postId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Title',
        content: 'Updated Content',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Post updated');
    expect(res.body.post.title).toBe('Updated Title');
    expect(res.body.post.content).toBe('Updated Content');
  });

  test('Updating non-existent post returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/admin/posts/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Any', content: 'Any' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Post not found');
  });

  test('Admin can delete a post', async () => {
    const res = await request(app)
      .delete(`/admin/posts/${postId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Post deleted successfully');
  });

  test('Deleting non-existent post returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/admin/posts/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Post not found');
  });

  test('User without admin role cannot delete post', async () => {
    // Tạo post mới để test
    const post = await Post.create({
      title: 'User post',
      content: 'User content',
      author: new mongoose.Types.ObjectId(),
    });
    const res = await request(app)
      .delete(`/admin/posts/${post._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Forbidden: Admins only');
  });
});
