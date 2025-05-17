const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../app');
const User = require('../models/User');
const Message = require('../models/Message');

let mongoServer;
let user1Token, _user2Token;
let user1Id, user2Id;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Tạo 2 user
  const user1 = await User.create({ email: 'user1@example.com', password: '123456', role: 'user' });
  const user2 = await User.create({ email: 'user2@example.com', password: '123456', role: 'user' });

  user1Id = user1._id;
  user2Id = user2._id;

  // Tạo token
  user1Token = jwt.sign({ id: user1._id }, process.env.JWT_SECRET || 'testsecret');
  _user2Token = jwt.sign({ id: user2._id }, process.env.JWT_SECRET || 'testsecret');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Xoá sạch messages sau mỗi test
  await Message.deleteMany({});
});

describe('POST /messages', () => {
  it('should create a new message', async () => {
    const res = await request(app)
      .post('/messages')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        recipient: user2Id.toString(),
        content: 'Hello user2!',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.content).toBe('Hello user2!');
    expect(res.body.sender).toBe(user1Id.toString());
    expect(res.body.recipient).toBe(user2Id.toString());
  });

  it('should return 400 if missing fields', async () => {
    const res = await request(app)
      .post('/messages')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        content: 'No recipient',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Missing fields');
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app).post('/messages').send({
      recipient: user2Id.toString(),
      content: 'Hello',
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /messages/:userId', () => {
  beforeEach(async () => {
    // Tạo vài message giữa user1 và user2
    await Message.create([
      { sender: user1Id, recipient: user2Id, content: 'Hi user2' },
      { sender: user2Id, recipient: user1Id, content: 'Hi user1' },
      { sender: user1Id, recipient: user2Id, content: 'How are you?' },
    ]);
  });

  it('should get messages between two users', async () => {
    const res = await request(app)
      .get(`/messages/${user2Id.toString()}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    expect(res.body[0].content).toBe('Hi user2');
    expect(res.body[1].content).toBe('Hi user1');
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app).get(`/messages/${user2Id.toString()}`);
    expect(res.statusCode).toBe(401);
  });
});
