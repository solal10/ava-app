const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authMiddleware, adminMiddleware } = require('../../middlewares/auth.middleware');
const { apiLimiter, generalLimiter } = require('../../middlewares/security.middleware');

// Routes pour les utilisateurs
router.post('/register-token', authMiddleware, generalLimiter, notificationController.registerFCMToken);
router.post('/unregister-token', authMiddleware, generalLimiter, notificationController.unregisterFCMToken);
router.post('/subscribe-topic', authMiddleware, generalLimiter, notificationController.subscribeToTopic);
router.post('/unsubscribe-topic', authMiddleware, generalLimiter, notificationController.unsubscribeFromTopic);

router.get('/preferences', authMiddleware, notificationController.getNotificationPreferences);
router.put('/preferences', authMiddleware, generalLimiter, notificationController.updateNotificationPreferences);
router.get('/history', authMiddleware, notificationController.getNotificationHistory);
router.get('/templates', authMiddleware, notificationController.getNotificationTemplates);

router.post('/test', authMiddleware, generalLimiter, notificationController.testNotification);

// Routes administratives (nécessitent privilèges admin)
router.post('/send', [authMiddleware, adminMiddleware], apiLimiter, notificationController.sendNotification);
router.post('/send-bulk', [authMiddleware, adminMiddleware], apiLimiter, notificationController.sendBulkNotifications);
router.post('/send-topic', [authMiddleware, adminMiddleware], apiLimiter, notificationController.sendTopicNotification);
router.post('/send-template', [authMiddleware, adminMiddleware], apiLimiter, notificationController.sendTemplateNotification);

router.get('/status', [authMiddleware, adminMiddleware], notificationController.getServiceStatus);

module.exports = router;