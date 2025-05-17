const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const _Post = require('../models/Post');
const jwt = require('jsonwebtoken');

let mongoServer;
let userToken, adminToken, postId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Tạo user thường
  const user = await User.create({ email: 'user@example.com', password: '123456', role: 'user' });
  userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret');

  // Tạo admin
  const admin = await User.create({ email: 'admin@example.com', password: '123456', role: 'admin' });
  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'testsecret');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /posts', () => {
  test('User can create a post', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Post', content: 'This is a test post.' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    postId = res.body._id;
  });

  test('Unauthorized user cannot create post', async () => {
    const res = await request(app).post('/posts').send({ title: 'No token', content: '...' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /posts', () => {
  test('Anyone can view list of posts', async () => {
    const res = await request(app).get('/posts');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);  // ✅
    expect(res.body.posts.length).toBeGreaterThan(0);  // ✅

  });

  test('Anyone can view a single post', async () => {
    const res = await request(app).get(`/posts/${postId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', postId);
  });
});

describe('PUT /posts/:id', () => {
  test('Author can update their post', async () => {
    const res = await request(app)
      .put(`/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Updated Title' });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  test('Other user cannot update post', async () => {
    const anotherUser = await User.create({ email: 'other@example.com', password: '111111' });
    const token = jwt.sign({ id: anotherUser._id }, process.env.JWT_SECRET || 'testsecret');

    const res = await request(app)
      .put(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hacked Title' });

    expect(res.statusCode).toBe(403);
  });
});

describe('DELETE /posts/:id', () => {
  test('Admin can delete post', async () => {
    const res = await request(app)
      .delete(`/posts/${postId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Post deleted');
  });

  test('Cannot delete nonexistent post', async () => {
    const res = await request(app)
      .delete(`/posts/000000000000000000000000`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('POST /posts/:postId/like', () => {
  let tempPostId;

  beforeEach(async () => {
    // Tạo 1 post mới cho mỗi test
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Post for like test', content: 'Some content' });

    expect(res.statusCode).toBe(201);
    tempPostId = res.body._id;
  });

  test('User can like and unlike a post', async () => {
    // Like
    let res = await request(app)
      .post(`/posts/${tempPostId}/like`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('likesCount', 1);

    // Unlike
    res = await request(app)
      .post(`/posts/${tempPostId}/like`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('likesCount', 0);
  });

  test('Like non-existent post returns 404', async () => {
    const res = await request(app)
      .post('/posts/000000000000000000000000/like')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('Unauthorized user cannot like', async () => {
    const res = await request(app)
      .post(`/posts/${tempPostId}/like`);

    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /posts/edit/:postId', () => {
  let editorToken, postToEditId;

  beforeAll(async () => {
    const editor = await User.create({ email: 'editor@example.com', password: '123456', role: 'editor' });
    editorToken = jwt.sign({ id: editor._id }, process.env.JWT_SECRET || 'testsecret');
  });

  beforeEach(async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Post to edit', content: 'Original content' });

    expect(res.statusCode).toBe(201);
    postToEditId = res.body._id;
  });

  test('Editor can edit a post and it becomes unapproved', async () => {
    const res = await request(app)
      .put(`/posts/edit/${postToEditId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ title: 'Edited Title by Editor', content: 'New content' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Post edited, pending approval');

    const updatedPost = await _Post.findById(postToEditId);
    expect(updatedPost.title).toBe('Edited Title by Editor');
    expect(updatedPost.approved).toBe(false);
  });

  test('Admin can edit a post and it becomes unapproved', async () => {
    const res = await request(app)
      .put(`/posts/edit/${postToEditId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Edit', content: 'Changed by admin' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Post edited, pending approval');

    const updatedPost = await _Post.findById(postToEditId);
    expect(updatedPost.title).toBe('Admin Edit');
    expect(updatedPost.approved).toBe(false);
  });

  test('Normal user cannot edit via /edit route', async () => {
    const res = await request(app)
      .put(`/posts/edit/${postToEditId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Should not work' });

    expect(res.statusCode).toBe(403);
  });

  test('Editing non-existent post returns 404', async () => {
    const fakeId = '000000000000000000000000';
    const res = await request(app)
      .put(`/posts/edit/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Nothing' });

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /posts/search', () => {
  beforeAll(async () => {
    const user = await User.findOne({ email: 'user@example.com' });

    await _Post.insertMany([
      {
        title: 'Learn JavaScript',
        content: 'JavaScript basics and advanced topics.',
        author: user._id,
        category: 'tech',
        status: 'published',
      },
      {
        title: 'Healthy Living Tips',
        content: 'Sleep well, eat healthy, and exercise.',
        author: user._id,
        category: 'lifestyle',
        status: 'draft',
      },
      {
        title: 'Node.js Tutorial',
        content: 'Server-side programming with Node.js',
        author: user._id,
        category: 'tech',
        status: 'published',
      },
    ]);
  });

  test('Search by keyword (full-text)', async () => {
    const res = await request(app)
      .get('/posts/search?keyword=node')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBeGreaterThan(0);
    expect(res.body.posts[0].title.toLowerCase()).toContain('node');
  });

  test('Filter by category', async () => {
    const res = await request(app)
      .get('/posts/search?category=tech')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts.every(p => p.category === 'tech')).toBe(true);
  });

  test('Filter by status', async () => {
    const res = await request(app)
      .get('/posts/search?status=published')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts.every(p => p.status === 'published')).toBe(true);
  });

  test('Filter by date range', async () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const res = await request(app)
      .get(`/posts/search?from=${from}&to=${to}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);

    res.body.posts.forEach(post => {
      const created = new Date(post.createdAt);
      expect(created >= new Date(from)).toBe(true);
      expect(created <= new Date(to)).toBe(true);
    });
  });
});

