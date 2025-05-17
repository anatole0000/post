const request = require('supertest');
const setup = require('./setup');

let app;

beforeEach(() => {
  ({ app } = setup());
});

describe('Auth Tests', () => {
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
});
