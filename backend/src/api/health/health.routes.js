const express = require('express');
const router = express.Router();
const healthController = require('./health.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Routes protégées avec userId
router.post('/add/:userId', authMiddleware, healthController.addHealthEntry);
router.get('/history/:userId', authMiddleware, healthController.getHealthHistory);
router.get('/latest/:userId', authMiddleware, healthController.getLatestHealth);

// Routes dashboard (sans userId - récupéré du token JWT)
router.get('/', authMiddleware, healthController.getDashboardHealthData);
router.post('/add', authMiddleware, healthController.addUserHealthEntry);

module.exports = router;
