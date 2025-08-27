const express = require('express');
const router = express.Router();
const healthController = require('./health.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Routes protégées
router.post('/:userId', authMiddleware, healthController.addHealthEntry);
router.get('/:userId', authMiddleware, healthController.getHealthHistory);
router.get('/:userId/latest', authMiddleware, healthController.getLatestHealth);

module.exports = router;
