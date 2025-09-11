const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validateUserProfile, handleValidationErrors } = require('../../middlewares/validation.middleware');

// Routes publiques (webhooks)
router.post('/webhook/stripe', express.raw({type: 'application/json'}), subscriptionController.handleStripeWebhook);

// Routes protégées
router.get('/', authMiddleware, subscriptionController.getCurrentSubscription);
router.post('/create-session', authMiddleware, subscriptionController.createPaymentSession);
router.post('/cancel', authMiddleware, subscriptionController.cancelSubscription);
router.get('/history', authMiddleware, subscriptionController.getPaymentHistory);
router.post('/portal', authMiddleware, subscriptionController.createPortalSession);

module.exports = router;
