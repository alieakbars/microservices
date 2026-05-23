jest.mock('../src/config/database', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/config/redis', () => ({
  connect: jest.fn(),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delByPattern: jest.fn().mockResolvedValue(undefined),
  buildKey: jest.fn((prefix, id) => `redis_ali_akbar_betest:${prefix}:${id}`),
}));

jest.mock('../src/services/userService', () => ({
  createUser: jest.fn(),
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  getUserByAccountNumber: jest.fn(),
  getUserByIdentityNumber: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const authService = require('../src/services/authService');
const userService = require('../src/services/userService');

let token;

const testUser = {
  id: 'uuid-test-001',
  _id: 'uuid-test-001',
  userName: 'Test User',
  accountNumber: '9876543210',
  emailAddress: 'test@example.com',
  identityNumber: '1234567890123456',
};

beforeAll(() => {
  token = authService.generateToken({ userId: 'test-id', userName: 'tester' });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /health', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('ms-ali-akbar-betest');
  });
});

describe('POST /api/auth/token', () => {
  it('should generate a JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/token')
      .send({ userName: 'testuser' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.tokenType).toBe('Bearer');
  });

  it('should return 422 when userName is missing', async () => {
    const res = await request(app).post('/api/auth/token').send({});
    expect(res.status).toBe(422);
  });
});

describe('GET /api/auth/verify', () => {
  it('should verify a valid token', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user).toHaveProperty('userName', 'tester');
  });

  it('should return 401 without a token', async () => {
    const res = await request(app).get('/api/auth/verify');
    expect(res.status).toBe(401);
  });

  it('should return 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/users', () => {
  it('should create a user', async () => {
    userService.createUser.mockResolvedValue(testUser);
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userName: testUser.userName,
        accountNumber: testUser.accountNumber,
        emailAddress: testUser.emailAddress,
        identityNumber: testUser.identityNumber,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountNumber).toBe(testUser.accountNumber);
  });

  it('should return 422 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ userName: 'Only Name' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 409 when email already in use', async () => {
    const err = new Error('Email address already in use');
    err.statusCode = 409;
    userService.createUser.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userName: testUser.userName,
        accountNumber: testUser.accountNumber,
        emailAddress: testUser.emailAddress,
        identityNumber: testUser.identityNumber,
      });
    expect(res.status).toBe(409);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/users')
      .send(testUser);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users', () => {
  it('should return paginated list of users', async () => {
    userService.getAllUsers.mockResolvedValue({
      users: [testUser],
      total: 1,
      page: 1,
      limit: 10,
    });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/:id', () => {
  it('should get user by id', async () => {
    userService.getUserById.mockResolvedValue(testUser);
    const res = await request(app)
      .get(`/api/users/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testUser.id);
  });

  it('should return 404 for unknown id', async () => {
    const err = new Error('User not found'); err.statusCode = 404;
    userService.getUserById.mockRejectedValue(err);

    const res = await request(app)
      .get('/api/users/unknown-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/users/account/:accountNumber', () => {
  it('should get user by accountNumber', async () => {
    userService.getUserByAccountNumber.mockResolvedValue(testUser);
    const res = await request(app)
      .get(`/api/users/account/${testUser.accountNumber}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.accountNumber).toBe(testUser.accountNumber);
  });

  it('should return 404 for unknown accountNumber', async () => {
    const err = new Error('User not found'); err.statusCode = 404;
    userService.getUserByAccountNumber.mockRejectedValue(err);

    const res = await request(app)
      .get('/api/users/account/0000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/users/identity/:identityNumber', () => {
  it('should get user by identityNumber', async () => {
    userService.getUserByIdentityNumber.mockResolvedValue(testUser);
    const res = await request(app)
      .get(`/api/users/identity/${testUser.identityNumber}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.identityNumber).toBe(testUser.identityNumber);
  });

  it('should return 404 for unknown identityNumber', async () => {
    const err = new Error('User not found'); err.statusCode = 404;
    userService.getUserByIdentityNumber.mockRejectedValue(err);

    const res = await request(app)
      .get('/api/users/identity/0000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/:id', () => {
  it('should update a user', async () => {
    const updated = { ...testUser, userName: 'Updated Name' };
    userService.updateUser.mockResolvedValue(updated);

    const res = await request(app)
      .put(`/api/users/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.userName).toBe('Updated Name');
  });

  it('should return 404 for unknown user id', async () => {
    const err = new Error('User not found'); err.statusCode = 404;
    userService.updateUser.mockRejectedValue(err);

    const res = await request(app)
      .put('/api/users/nonexistent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ userName: 'Nobody' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/:id', () => {
  it('should delete a user', async () => {
    userService.deleteUser.mockResolvedValue(testUser);

    const res = await request(app)
      .delete(`/api/users/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when user does not exist', async () => {
    const err = new Error('User not found'); err.statusCode = 404;
    userService.deleteUser.mockRejectedValue(err);

    const res = await request(app)
      .delete('/api/users/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('404 handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
  });
});
