const express = require('express');
const router = express.Router();
const iaController = require('./ia.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Routes protégées par l'authentification
router.post('/ask', authMiddleware, iaController.askCoach);
router.post('/learn', authMiddleware, iaController.learnFromUserInput);

module.exports = router;
