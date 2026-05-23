const authService = require('../src/services/authService');

describe('AuthService', () => {
  const mockPayload = { userId: 'test-user-id', userName: 'testuser' };

  describe('generateToken', () => {
    it('should generate a valid JWT string', () => {
      const token = authService.generateToken(mockPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should embed payload in the token', () => {
      const token = authService.generateToken(mockPayload);
      const decoded = authService.verifyToken(token);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.userName).toBe(mockPayload.userName);
    });
  });

  describe('verifyToken', () => {
    it('should return decoded payload for a valid token', () => {
      const token = authService.generateToken(mockPayload);
      const decoded = authService.verifyToken(token);
      expect(decoded).toHaveProperty('userId', mockPayload.userId);
    });

    it('should throw JsonWebTokenError for an invalid token', () => {
      expect(() => authService.verifyToken('invalid.token.here')).toThrow();
    });

    it('should throw for an expired token', () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(mockPayload, authService.secret, { expiresIn: '-1s' });
      expect(() => authService.verifyToken(expiredToken)).toThrow('jwt expired');
    });
  });

  describe('extractToken', () => {
    it('should extract token from a valid Bearer header', () => {
      const token = authService.generateToken(mockPayload);
      const extracted = authService.extractToken(`Bearer ${token}`);
      expect(extracted).toBe(token);
    });

    it('should return null when Authorization header is missing', () => {
      expect(authService.extractToken(undefined)).toBeNull();
      expect(authService.extractToken('')).toBeNull();
    });

    it('should return null for non-Bearer schemes', () => {
      expect(authService.extractToken('Basic sometoken')).toBeNull();
    });
  });
});
