const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const ValidationMiddleware = require('../middleware/validationMiddleware');

router.post('/token', ValidationMiddleware.generateToken(), authController.generateToken.bind(authController));
router.get('/verify', authMiddleware, authController.verifyToken.bind(authController));

module.exports = router;
