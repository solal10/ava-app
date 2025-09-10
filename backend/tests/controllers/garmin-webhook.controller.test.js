// Charger les variables d'environnement de test
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const express = require('express');
const garminController = require('../../src/api/garmin/garmin.controller');

// Setup Express app pour les tests
const app = express();
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Mock authentication middleware 
const mockAuthMiddleware = (req, res, next) => {
  req.userId = 'test-user-id';
  next();
};

// Routes de test webhook
app.post('/api/garmin/webhook', garminController.receiveWebhookData);
app.post('/api/garmin/webhook/register', mockAuthMiddleware, garminController.registerUserWebhook);
app.get('/api/garmin/webhook/status/:userId', mockAuthMiddleware, garminController.getWebhookStatus);
app.get('/api/garmin/webhook/stats', mockAuthMiddleware, garminController.getWebhookStats);
app.get('/api/garmin/webhook/test', garminController.testWebhookConnectivity);

describe('Garmin Webhook Controller', () => {
  
  describe('POST /api/garmin/webhook', () => {
    it('devrait recevoir et traiter un webhook Garmin', async () => {
      const webhookPayload = {
        events: [{
          eventType: 'DAILY_SUMMARY_CREATED',
          userId: 'test-user-123',
          summaryId: 'summary-456',
          userAccessToken: 'token-789'
        }]
      };

      const response = await request(app)
        .post('/api/garmin/webhook')
        .set({
          'X-Garmin-Signature': 'sha256=test-signature',
          'X-Garmin-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'Content-Type': 'application/json'
        })
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'received');
      expect(response.body).toHaveProperty('itemsReceived');
      expect(response.body.itemsReceived).toBeGreaterThan(0);
    });

    it('devrait accepter les webhooks sans signature si secret non configuré', async () => {
      const webhookPayload = {
        eventType: 'ACTIVITY_CREATED',
        userId: 'test-user-456',
        activityId: 'activity-789'
      };

      const response = await request(app)
        .post('/api/garmin/webhook')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('received');
    });
  });

  describe('POST /api/garmin/webhook/register', () => {
    it('devrait enregistrer un webhook pour un utilisateur', async () => {
      const registerData = {
        userId: 'user-123',
        callbackUrl: 'https://example.com/webhook',
        eventTypes: ['health', 'activity', 'sleep']
      };

      const response = await request(app)
        .post('/api/garmin/webhook/register')
        .send(registerData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe('user-123');
      expect(response.body.callbackUrl).toBe('https://example.com/webhook');
    });

    it('devrait retourner une erreur si userId manquant', async () => {
      const registerData = {
        callbackUrl: 'https://example.com/webhook'
      };

      const response = await request(app)
        .post('/api/garmin/webhook/register')
        .send(registerData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('userId et callbackUrl requis');
    });
  });

  describe('GET /api/garmin/webhook/status/:userId', () => {
    it('devrait retourner le statut webhook pour un utilisateur', async () => {
      const response = await request(app)
        .get('/api/garmin/webhook/status/test-user-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe('test-user-123');
      expect(response.body).toHaveProperty('webhookStatus');
      expect(response.body.webhookStatus).toHaveProperty('isActive');
    });

    it('devrait retourner une erreur si userId manquant', async () => {
      const response = await request(app)
        .get('/api/garmin/webhook/status/');

      expect(response.status).toBe(404); // Route not found
    });
  });

  describe('GET /api/garmin/webhook/stats', () => {
    it('devrait retourner les statistiques des webhooks', async () => {
      const response = await request(app)
        .get('/api/garmin/webhook/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('queueLength');
      expect(response.body).toHaveProperty('isProcessing');
    });

    it('devrait accepter un paramètre de plage horaire', async () => {
      const response = await request(app)
        .get('/api/garmin/webhook/stats?hours=48');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.timeRange).toBe('48h');
    });
  });

  describe('GET /api/garmin/webhook/test', () => {
    it('devrait retourner le statut de connectivité du service webhook', async () => {
      const response = await request(app)
        .get('/api/garmin/webhook/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('GarminWebhookService');
      expect(response.body.status).toBe('operational');
      expect(response.body).toHaveProperty('features');
      expect(response.body.features).toHaveProperty('signatureValidation');
      expect(response.body.features).toHaveProperty('queueProcessing');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de traitement webhook', async () => {
      // Test avec un payload malformé
      const response = await request(app)
        .post('/api/garmin/webhook')
        .set('Content-Type', 'application/json')
        .send('invalid-json{');

      expect(response.status).toBe(400); // Bad request pour JSON invalide
    });
  });

  describe('Types d\'événements supportés', () => {
    const supportedEvents = [
      'ACTIVITY_CREATED',
      'ACTIVITY_UPDATED',
      'DAILY_SUMMARY_CREATED',
      'SLEEP_CREATED',
      'STRESS_CREATED',
      'BODY_BATTERY_CREATED'
    ];

    supportedEvents.forEach(eventType => {
      it(`devrait traiter l'événement ${eventType}`, async () => {
        const webhookPayload = {
          eventType,
          userId: 'test-user-123',
          summaryId: 'summary-456',
          userAccessToken: 'token-789'
        };

        const response = await request(app)
          .post('/api/garmin/webhook')
          .send(webhookPayload);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('received');
      });
    });
  });
});