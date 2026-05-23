const userRepository = require('../repositories/userRepository');
const redisClient = require('../config/redis');

class UserService {
  constructor(repository, cache) {
    this.repository = repository;
    this.cache = cache;
    this.CACHE_PREFIX = 'user';
  }

  _keyById(id) {
    return this.cache.buildKey(this.CACHE_PREFIX, `id:${id}`);
  }

  _keyByAccount(accountNumber) {
    return this.cache.buildKey(this.CACHE_PREFIX, `account:${accountNumber}`);
  }

  _keyByIdentity(identityNumber) {
    return this.cache.buildKey(this.CACHE_PREFIX, `identity:${identityNumber}`);
  }

  _keyList(page, limit) {
    return this.cache.buildKey(this.CACHE_PREFIX, `list:${page}:${limit}`);
  }

  async _invalidateUser(user) {
    if (!user) return;
    await Promise.all([
      this.cache.del(this._keyById(user._id || user.id)),
      this.cache.del(this._keyByAccount(user.accountNumber)),
      this.cache.del(this._keyByIdentity(user.identityNumber)),
      this.cache.delByPattern(
        this.cache.buildKey(this.CACHE_PREFIX, 'list:*')
      ),
    ]);
  }

  async createUser(userData) {
    const existing = await this.repository.findByEmail(userData.emailAddress);
    if (existing) {
      const err = new Error('Email address already in use');
      err.statusCode = 409;
      throw err;
    }

    const user = await this.repository.create(userData);

    await this.cache.delByPattern(
      this.cache.buildKey(this.CACHE_PREFIX, 'list:*')
    );

    return user;
  }

  async getAllUsers({ page = 1, limit = 10 } = {}) {
    const cacheKey = this._keyList(page, limit);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.repository.findAll({ page, limit });
    await this.cache.set(cacheKey, result);
    return result;
  }

  async getUserById(id) {
    const cacheKey = this._keyById(id);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const user = await this.repository.findById(id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    await this.cache.set(cacheKey, user);
    return user;
  }

  async getUserByAccountNumber(accountNumber) {
    const cacheKey = this._keyByAccount(accountNumber);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const user = await this.repository.findByAccountNumber(accountNumber);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    await this.cache.set(cacheKey, user);
    return user;
  }

  async getUserByIdentityNumber(identityNumber) {
    const cacheKey = this._keyByIdentity(identityNumber);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const user = await this.repository.findByIdentityNumber(identityNumber);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    await this.cache.set(cacheKey, user);
    return user;
  }

  async updateUser(id, updateData) {
    const oldUser = await this.repository.findById(id);
    if (!oldUser) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const updated = await this.repository.update(id, updateData);
    await this._invalidateUser(oldUser);
    return updated;
  }

  async deleteUser(id) {
    const user = await this.repository.findById(id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    await this.repository.delete(id);
    await this._invalidateUser(user);
    return user;
  }
}

module.exports = new UserService(userRepository, redisClient);
