const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const ValidationMiddleware = require('../middleware/validationMiddleware');

router.use(authMiddleware);
router.post('/', ValidationMiddleware.createUser(), userController.createUser.bind(userController));
router.get('/', userController.getAllUsers.bind(userController));
router.get('/account/:accountNumber', userController.getUserByAccountNumber.bind(userController));
router.get('/identity/:identityNumber', userController.getUserByIdentityNumber.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));
router.put('/:id', ValidationMiddleware.updateUser(), userController.updateUser.bind(userController));
router.delete('/:id', userController.deleteUser.bind(userController));

module.exports = router;
