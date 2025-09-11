const express = require('express');
const router = express.Router();
const EmailController = require('./email.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

/**
 * Routes pour les notifications email
 */

// Statut du service email (public pour tests)
router.get('/status', EmailController.getEmailStatus);

// Test de configuration email (authentifié)
router.post('/test', authenticate, EmailController.sendTestEmail);

// Emails spécifiques (authentifiés)
router.post('/welcome', authenticate, EmailController.sendWelcomeEmail);
router.post('/health-report', authenticate, EmailController.sendWeeklyHealthReport);
router.post('/garmin-connection', authenticate, EmailController.sendGarminConnectionEmail);
router.post('/goal-achievement', authenticate, EmailController.sendGoalAchievementEmail);

// Envoi en lot (admin seulement)
router.post('/bulk', authenticate, EmailController.sendBulkEmails);

// Programmer rapports hebdomadaires (admin seulement) 
router.post('/schedule/weekly-reports', authenticate, EmailController.scheduleWeeklyReports);

module.exports = router;