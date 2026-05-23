const UserService = require('../src/services/userService');

const mockRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByAccountNumber: jest.fn(),
  findByIdentityNumber: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delByPattern: jest.fn().mockResolvedValue(undefined),
  buildKey: jest.fn((prefix, id) => `redis_ali_akbar_betest:${prefix}:${id}`),
};

const { UserService: UserServiceClass } = (() => {
  const path = require('path');
  const fs = require('fs');
  const src = fs.readFileSync(
    path.join(__dirname, '../src/services/userService.js'),
    'utf8'
  );
  const modSrc = src
    .replace("const userRepository = require('../repositories/userRepository');", '')
    .replace("const redisClient = require('../config/redis');", '')
    .replace('module.exports = new UserService(userRepository, redisClient);', 'module.exports = { UserService };');
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', modSrc)(mod, mod.exports, require);
  return mod.exports;
})();

describe('UserService', () => {
  let service;

  const mockUser = {
    _id: 'uuid-001',
    userName: 'John Doe',
    accountNumber: '1234567890',
    emailAddress: 'john@example.com',
    identityNumber: '1234567890123456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserServiceClass(mockRepo, mockCache);
  });

  describe('createUser', () => {
    it('should create a user when email is not taken', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockUser);

      const result = await service.createUser(mockUser);
      expect(mockRepo.create).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw 409 when email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createUser(mockUser)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Email address already in use',
      });
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should return cached result when available', async () => {
      const cached = { users: [mockUser], total: 1 };
      mockCache.get.mockResolvedValue(cached);

      const result = await service.getAllUsers({ page: 1, limit: 10 });
      expect(result).toEqual(cached);
      expect(mockRepo.findAll).not.toHaveBeenCalled();
    });

    it('should query DB and cache result on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      const dbResult = { users: [mockUser], total: 1, page: 1, limit: 10 };
      mockRepo.findAll.mockResolvedValue(dbResult);

      const result = await service.getAllUsers({ page: 1, limit: 10 });
      expect(mockRepo.findAll).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
      expect(result).toEqual(dbResult);
    });
  });

  describe('getUserById', () => {
    it('should return user from cache when available', async () => {
      mockCache.get.mockResolvedValue(mockUser);

      const result = await service.getUserById('uuid-001');
      expect(result).toEqual(mockUser);
      expect(mockRepo.findById).not.toHaveBeenCalled();
    });

    it('should fetch from DB on cache miss and cache it', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('uuid-001');
      expect(mockRepo.findById).toHaveBeenCalledWith('uuid-001');
      expect(mockCache.set).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw 404 when user not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getUserById('unknown')).rejects.toMatchObject({
        statusCode: 404,
        message: 'User not found',
      });
    });
  });

  describe('getUserByAccountNumber', () => {
    it('should return user by accountNumber from DB when cache misses', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findByAccountNumber.mockResolvedValue(mockUser);

      const result = await service.getUserByAccountNumber('1234567890');
      expect(mockRepo.findByAccountNumber).toHaveBeenCalledWith('1234567890');
      expect(result).toEqual(mockUser);
    });

    it('should throw 404 when accountNumber not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findByAccountNumber.mockResolvedValue(null);

      await expect(service.getUserByAccountNumber('9999999999')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('getUserByIdentityNumber', () => {
    it('should return user by identityNumber from DB when cache misses', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findByIdentityNumber.mockResolvedValue(mockUser);

      const result = await service.getUserByIdentityNumber('1234567890123456');
      expect(mockRepo.findByIdentityNumber).toHaveBeenCalledWith('1234567890123456');
      expect(result).toEqual(mockUser);
    });

    it('should throw 404 when identityNumber not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findByIdentityNumber.mockResolvedValue(null);

      await expect(service.getUserByIdentityNumber('0000000000000000')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('updateUser', () => {
    it('should update user and invalidate cache', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);
      const updated = { ...mockUser, userName: 'Jane Doe' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateUser('uuid-001', { userName: 'Jane Doe' });
      expect(mockRepo.update).toHaveBeenCalledWith('uuid-001', { userName: 'Jane Doe' });
      expect(mockCache.del).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should throw 404 when user to update does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.updateUser('ghost-id', {})).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user and invalidate cache', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);
      mockRepo.delete.mockResolvedValue(mockUser);

      await service.deleteUser('uuid-001');
      expect(mockRepo.delete).toHaveBeenCalledWith('uuid-001');
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('should throw 404 when user to delete does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.deleteUser('ghost-id')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
