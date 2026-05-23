const { body, param, validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

class ValidationMiddleware {
  static validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseHandler.validationError(res, errors.array());
    }
    next();
  }

  static createUser() {
    return [
      body('userName')
        .trim()
        .notEmpty().withMessage('userName is required')
        .isLength({ min: 2, max: 100 }).withMessage('userName must be 2-100 characters'),

      body('accountNumber')
        .trim()
        .notEmpty().withMessage('accountNumber is required')
        .matches(/^\d{6,20}$/).withMessage('accountNumber must be 6-20 digits'),

      body('emailAddress')
        .trim()
        .notEmpty().withMessage('emailAddress is required')
        .isEmail().withMessage('emailAddress must be a valid email'),

      body('identityNumber')
        .trim()
        .notEmpty().withMessage('identityNumber is required')
        .matches(/^\d{10,20}$/).withMessage('identityNumber must be 10-20 digits'),

      ValidationMiddleware.validate,
    ];
  }

  static updateUser() {
    return [
      body('userName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('userName must be 2-100 characters'),

      body('accountNumber')
        .optional()
        .trim()
        .matches(/^\d{6,20}$/).withMessage('accountNumber must be 6-20 digits'),

      body('emailAddress')
        .optional()
        .trim()
        .isEmail().withMessage('emailAddress must be a valid email'),

      body('identityNumber')
        .optional()
        .trim()
        .matches(/^\d{10,20}$/).withMessage('identityNumber must be 10-20 digits'),

      ValidationMiddleware.validate,
    ];
  }

  static generateToken() {
    return [
      body('userName')
        .trim()
        .notEmpty().withMessage('userName is required'),

      body('userId')
        .optional()
        .trim(),

      ValidationMiddleware.validate,
    ];
  }
}

module.exports = ValidationMiddleware;
