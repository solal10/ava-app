const express = require('express');
const router = express.Router();
const garminController = require('./garmin.controller'); // Instance déjà créée

/**
 * Routes pour l'intégration Garmin Connect OAuth 2.0 + PKCE
 */

// Routes OAuth 2.0 principales
router.get('/login', (req, res) => garminController.login(req, res));
router.get('/rappel', (req, res) => garminController.callback(req, res)); // ✅ callback au lieu de rappel

// Routes pour les données de santé
router.get('/health-data', garminController.getHealthData);

// 🎯 WEBHOOK ENDPOINTS - Système temps réel
router.post('/webhook', garminController.receiveWebhookData);
router.post('/webhook/register', garminController.registerUserWebhook);
router.get('/webhook/status/:userId', garminController.getWebhookStatus);

// Legacy routes pour compatibilité
router.post('/auth-url', (req, res) => garminController.login(req, res));

// Route de test de connexion
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Garmin OAuth 2.0 + PKCE routes ready',
    endpoints: {
      login: '/auth/garmin/login',
      callback: '/auth/garmin/rappel'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
