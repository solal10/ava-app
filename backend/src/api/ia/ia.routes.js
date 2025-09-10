const express = require('express');
const router = express.Router();
const iaController = require('./ia.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Routes protégées par l'authentification
router.post('/ask', authMiddleware, iaController.askCoach);
router.get('/history', authMiddleware, iaController.getConversationHistory);
router.get('/analytics', authMiddleware, iaController.getConversationAnalytics);
router.post('/feedback', authMiddleware, iaController.provideFeedback);
router.delete('/history', authMiddleware, iaController.clearConversationHistory);
router.get('/usage-limits', authMiddleware, iaController.getUsageLimits);

// Routes de diagnostic et administration
router.get('/status', authMiddleware, iaController.getServiceStatus);
router.post('/test-api', authMiddleware, iaController.testAPIConnections);

module.exports = router;
