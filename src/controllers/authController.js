const authService = require('../services/authService');
const ResponseHandler = require('../utils/responseHandler');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  generateToken(req, res) {
    try {
      const { userName, userId } = req.body;
      const payload = {
        userId: userId || uuidv4(),
        userName,
      };
      const token = authService.generateToken(payload);
      return ResponseHandler.success(
        res,
        {
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '1h',
          tokenType: 'Bearer',
        },
        'Token generated successfully'
      );
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  verifyToken(req, res) {
    return ResponseHandler.success(
      res,
      { user: req.user },
      'Token is valid'
    );
  }
}

module.exports = new AuthController();
