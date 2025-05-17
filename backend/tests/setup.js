// tests/setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Post = require('../models/Post');

let mongoServer;
let token = '';
let postId = '';

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } else {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany();
  await Post.deleteMany();

  // Tạo người dùng
  await request(app).post('/auth/register').send({
    email: 'test@example.com',
    password: '123456',
  });

  const res = await request(app).post('/auth/login').send({
    email: 'test@example.com',
    password: '123456',
  });

  token = res.body.token;

  const postRes = await request(app)
    .post('/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Sample Post', content: 'Test content' });

  postId = postRes.body._id;
});

module.exports = () => ({ app, token, postId });
