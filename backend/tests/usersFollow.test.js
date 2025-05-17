const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');

let mongoServer;
let userA, userB, tokenA, _tokenB;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Tạo 2 user
  userA = await User.create({ email: 'userA@example.com', password: '123456' });
  tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET || 'testsecret');

  userB = await User.create({ email: 'userB@example.com', password: '123456' });
  _tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET || 'testsecret');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /users/follow/:userId/follow', () => {
  test('User A can follow and unfollow user B', async () => {
    // Follow
    let res = await request(app)
      .post(`/users/follow/${userB._id}/follow`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Followed');

    // Kiểm tra DB
    const updatedA = await User.findById(userA._id);
    const updatedB = await User.findById(userB._id);
    expect(updatedA.following.map(id => id.toString())).toContain(userB._id.toString());
    expect(updatedB.followers.map(id => id.toString())).toContain(userA._id.toString());

    // Unfollow
    res = await request(app)
      .post(`/users/follow/${userB._id}/follow`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Unfollowed');

    // Kiểm tra DB sau unfollow
    const afterUnfollowA = await User.findById(userA._id);
    const afterUnfollowB = await User.findById(userB._id);
    expect(afterUnfollowA.following).not.toContainEqual(userB._id);
    expect(afterUnfollowB.followers).not.toContainEqual(userA._id);
  });

  test('Cannot follow yourself', async () => {
    const res = await request(app)
      .post(`/users/follow/${userA._id}/follow`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/can't follow yourself/i);
  });

  test('Follow non-existent user returns 404', async () => {
    const res = await request(app)
      .post('/users/000000000000000000000000/follow')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.statusCode).toBe(404);
  });

  test('Unauthorized user cannot follow', async () => {
    const res = await request(app)
      .post(`/users/follow/${userB._id}/follow`);
    expect(res.statusCode).toBe(401);
  });
});
