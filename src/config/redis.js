const Redis = require('ioredis');

class RedisClient {
  constructor() {
    if (RedisClient.instance) {
      return RedisClient.instance;
    }
    this.client = null;
    this.name = process.env.REDIS_NAME || 'redis_ali_akbar_betest';
    this.ttl = parseInt(process.env.REDIS_TTL, 10) || 3600;
    RedisClient.instance = this;
  }

  connect() {
    if (this.client) {
      return this.client;
    }

    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT, 10) || 6379;

    this.client = new Redis({ host, port, lazyConnect: true });

    this.client.on('connect', () => {
      console.log(`[Redis] Connected — ${this.name}`);
    });

    this.client.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });

    return this.client;
  }

  getClient() {
    if (!this.client) {
      return this.connect();
    }
    return this.client;
  }

  buildKey(prefix, identifier) {
    return `${this.name}:${prefix}:${identifier}`;
  }

  async get(key) {
    try {
      const data = await this.getClient().get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('[Redis] GET error:', err.message);
      return null;
    }
  }

  async set(key, value, ttl = this.ttl) {
    try {
      await this.getClient().set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      console.error('[Redis] SET error:', err.message);
    }
  }

  async del(key) {
    try {
      await this.getClient().del(key);
    } catch (err) {
      console.error('[Redis] DEL error:', err.message);
    }
  }

  async delByPattern(pattern) {
    try {
      const keys = await this.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.getClient().del(...keys);
      }
    } catch (err) {
      console.error('[Redis] DEL pattern error:', err.message);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

module.exports = new RedisClient();
