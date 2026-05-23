const mongoose = require('mongoose');
class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.connection = null;
    Database.instance = this;
  }

  async connect() {
    if (this.connection) {
      return this.connection;
    }

    try {
      const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/db_ali_akbar_betest';
      this.connection = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] Connected to MongoDB: db_ali_akbar_betest`);
      return this.connection;
    } catch (error) {
      console.error('[Database] Connection error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      console.log('[Database] Disconnected from MongoDB');
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new Database();
