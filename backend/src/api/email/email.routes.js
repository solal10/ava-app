const express = require('express');
const router = express.Router();
const {
  sendTestEmail,
  sendWelcomeEmail,
  sendWeeklyHealthReport,
  sendGarminConnectionEmail,
  sendGoalAchievementEmail,
  sendBulkEmails,
  getEmailStatus,
  scheduleWeeklyReports
} = require('./email.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

/**
 * Routes pour les notifications email
 */

// Statut du service email (public pour tests)
router.get('/status', getEmailStatus);

// Test de configuration email (authentifié)
router.post('/test', authMiddleware, sendTestEmail);

// Emails spécifiques (authentifiés)
router.post('/welcome', authMiddleware, sendWelcomeEmail);
router.post('/health-report', authMiddleware, sendWeeklyHealthReport);
router.post('/garmin-connection', authMiddleware, sendGarminConnectionEmail);
router.post('/goal-achievement', authMiddleware, sendGoalAchievementEmail);

// Envoi en lot (admin seulement)
router.post('/bulk', authMiddleware, sendBulkEmails);

// Programmer rapports hebdomadaires (admin seulement) 
router.post('/schedule/weekly-reports', authMiddleware, scheduleWeeklyReports);

module.exports = router;