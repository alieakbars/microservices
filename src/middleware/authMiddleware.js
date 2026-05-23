const authService = require('../services/authService');
const ResponseHandler = require('../utils/responseHandler');

const authMiddleware = (req, res, next) => {
  const token = authService.extractToken(req.headers.authorization);

  if (!token) {
    return ResponseHandler.unauthorized(res, 'Access denied. No token provided.');
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler.unauthorized(res, 'Token has expired.');
    }
    return ResponseHandler.unauthorized(res, 'Invalid token.');
  }
};

module.exports = authMiddleware;
