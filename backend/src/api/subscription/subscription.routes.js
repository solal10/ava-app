const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Toutes les routes d'abonnement sont protégées
router.get('/', authMiddleware, subscriptionController.getCurrentSubscription);
router.post('/update', authMiddleware, subscriptionController.updateSubscription);

module.exports = router;
