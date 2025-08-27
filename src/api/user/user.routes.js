const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/test-login', userController.testLogin);
router.post('/', userController.createTestUser);

// Routes protégées
router.get('/profile', authMiddleware, userController.getProfile);
router.get('/:id', authMiddleware, userController.getUserById);
router.put('/:id', authMiddleware, userController.updateUser);
router.put('/preferences', authMiddleware, userController.updatePreferences);

module.exports = router;
