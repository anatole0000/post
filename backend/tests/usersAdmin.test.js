const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');  // app Express của bạn
const User = require('../models/User');
const jwt = require('jsonwebtoken');

let mongoServer;
let adminToken;
let normalUserId;

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

  // Tạo user bình thường
  const user = await User.create({
    email: 'user@example.com',
    password: '123456',
    role: 'user',
  });
  normalUserId = user._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Admin User Management', () => {
  test('Admin can get paginated user list with search', async () => {
    const res = await request(app)
      .get('/users/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ q: 'user', page: 1, limit: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('currentPage');
  });

  test('Admin can get user detail by id', async () => {
    const res = await request(app)
      .get(`/users/admin/${normalUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'user@example.com');
    expect(res.body).not.toHaveProperty('password');
  });

  test('Admin can create a new user', async () => {
    const res = await request(app)
      .post('/users/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'newuser@example.com',
        password: 'newpass',
        role: 'user',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User đã được tạo thành công');
  });

  test('Admin can update user role', async () => {
    const res = await request(app)
      .put(`/users/admin/${normalUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'User đã được cập nhật thành công');

    const updatedUser = await User.findById(normalUserId);
    expect(updatedUser.role).toBe('admin');
  });

  test('Admin cannot update themselves', async () => {
    // Lấy id admin từ token
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'testsecret');

    const res = await request(app)
      .put(`/users/admin/${decoded.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Admin không thể thay đổi chính mình');
  });

  test('Admin can delete a user', async () => {
    // Tạo user mới để xóa
    const user = await User.create({
      email: 'deleteuser@example.com',
      password: '123456',
      role: 'user',
    });

    const res = await request(app)
      .delete(`/users/admin/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'User đã được xoá thành công');

    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  test('Admin cannot delete themselves', async () => {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'testsecret');

    const res = await request(app)
      .delete(`/users/admin/${decoded.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Admin không thể xoá chính mình');
  });
});
