const userService = require('../services/userService');
const ResponseHandler = require('../utils/responseHandler');

class UserController {
  async createUser(req, res) {
    try {
      const user = await userService.createUser(req.body);
      return ResponseHandler.created(res, user, 'User created successfully');
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        return ResponseHandler.conflict(res, `${field} already exists`);
      }
      if (error.statusCode === 409) {
        return ResponseHandler.conflict(res, error.message);
      }
      return ResponseHandler.error(res, error.message, error.statusCode || 500);
    }
  }

  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
      const result = await userService.getAllUsers({ page, limit });
      return ResponseHandler.success(res, result, 'Users retrieved successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, error.statusCode || 500);
    }
  }

  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      return ResponseHandler.success(res, user, 'User retrieved successfully');
    } catch (error) {
      if (error.statusCode === 404) {
        return ResponseHandler.notFound(res, error.message);
      }
      return ResponseHandler.error(res, error.message, error.statusCode || 500);
    }
  }

  async getUserByAccountNumber(req, res) {
    try {
      const user = await userService.getUserByAccountNumber(req.params.accountNumber);
      return ResponseHandler.success(res, user, 'User retrieved successfully');
    } catch (error) {
      if (error.statusCode === 404) {
        return ResponseHandler.notFound(res, error.message);
      }
      return ResponseHandler.error(res, error.message, error.statusCode || 500);
    }
  }

  async getUserByIdentityNumber(req, res) {
    try {
      const user = await userService.getUserByIdentityNumber(req.params.identityNumber);
      return ResponseHandler.success(res, user, 'User retrieved successfully');
    } catch (error) {
      if (error.statusCode === 404) {
        return ResponseHandler.notFound(res, error.message);
      }
      return ResponseHandler.error(res, error.message, error.statusCode || 500);
    }
  }

  async updateUser(req, res) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return ResponseHandler.success(res, user, 'User updated successfully');
    } catch (error) {
      if (error.statusCode === 404) {
        return ResponseHandler.notFound(res, error.message);
      }
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        return ResponseHandler.conflict(res, `${field} already exists`);
      }
      return ResponseHandler.error(res, error.message, error.statusCode || 500);
    }
  }

  async deleteUser(req, res) {
    try {
      await userService.deleteUser(req.params.id);
      return ResponseHandler.success(res, null, 'User deleted successfully');
    } catch (error) {
      if (error.statusCode === 404) {
        return ResponseHandler.notFound(res, error.message);
      }
      return ResponseHandler.error(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new UserController();
