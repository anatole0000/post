const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

jest.setTimeout(10000);

const User = require('../models/User');
const Post = require('../models/Post');

let token = '';
let postId = '';
let mongoServer;

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

  // Tạo user và login
  await request(app).post('/auth/register').send({
    email: 'test@example.com',
    password: '123456',
  });

  const res = await request(app).post('/auth/login').send({
    email: 'test@example.com',
    password: '123456',
  });

  token = res.body.token;

  // Tạo bài viết trước
  const postRes = await request(app)
    .post('/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'First Post', content: 'Hello world' });

  postId = postRes.body._id;
});

describe('Forum Integration Tests', () => {
  test('User Registration', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'unique@example.com', password: '123456' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  test('User Login', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Add Comment to Post', async () => {
    const res = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Nice post!' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('comments');
    expect(res.body.comments[0].content).toBe('Nice post!');
  });
});
