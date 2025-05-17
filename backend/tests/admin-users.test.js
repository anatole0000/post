const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');

let mongoServer;
let adminToken;
let userToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Tạo admin user
  const admin = await User.create({
    email: 'admin@example.com',
    password: '123456',
    role: 'admin',
  });
  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'testsecret');

  // Tạo user thường
  const user = await User.create({
    email: 'user1@example.com',
    password: '111111',
    role: 'user',
  });
  userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Xóa các user tạo thêm ngoài admin và user1 nếu có
  await User.deleteMany({ email: { $nin: ['admin@example.com', 'user1@example.com'] } });
});

describe('Permissions - Role-based Access Control', () => {
  test('Admin can view user list with pagination', async () => {
    const res = await request(app)
      .get('/users/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('currentPage');
    expect(res.body.currentPage).toBe(1);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  test('Admin can search users and paginate', async () => {
    await User.create({ email: 'searchtest@example.com', password: 'abc123', role: 'user' });

    const res = await request(app)
      .get('/users/admin')
      .query({ q: 'searchtest', page: 1, limit: 2 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeLessThanOrEqual(2);
    expect(res.body.users[0].email).toMatch(/searchtest/i);
  });

  test('Non-admin user cannot view user list', async () => {
    const res = await request(app)
      .get('/users/admin')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Forbidden: Admins only');
  });

  test('Unauthenticated request is rejected', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(401);
  });
});
