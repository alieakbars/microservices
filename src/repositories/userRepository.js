const User = require('../models/User');

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  async findAll({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);
    return { users, total, page, limit };
  }

  async findById(id) {
    return User.findById(id).lean();
  }

  async findByAccountNumber(accountNumber) {
    return User.findOne({ accountNumber }).lean();
  }

  async findByIdentityNumber(identityNumber) {
    return User.findOne({ identityNumber }).lean();
  }

  async findByEmail(emailAddress) {
    return User.findOne({ emailAddress: emailAddress.toLowerCase() }).lean();
  }

  async update(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async delete(id) {
    return User.findByIdAndDelete(id).lean();
  }
}

module.exports = new UserRepository();
