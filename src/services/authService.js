const jwt = require('jsonwebtoken');
class AuthService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'default_secret_change_me';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  }

  generateToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token) {
    return jwt.verify(token, this.secret);
  }

  extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }
}

module.exports = new AuthService();
