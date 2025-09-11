const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const notificationController = require('../../src/api/notification/notification.controller');
const User = require('../../src/models/user.model');

// Mock Firebase service
jest.mock('../../src/services/firebase.service', () => ({
  sendNotificationToUser: jest.fn(),
  sendNotificationToUsers: jest.fn(),
  sendTopicNotification: jest.fn(),
  registerFCMToken: jest.fn(),
  unregisterFCMToken: jest.fn(),
  subscribeToTopic: jest.fn(),
  unsubscribeFromTopic: jest.fn(),
  getNotificationTemplates: jest.fn(),
  isInitialized: true
}));

// Mock User model
jest.mock('../../src/models/user.model', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

const firebaseService = require('../../src/services/firebase.service');
const User = require('../../src/models/user.model');

const app = express();
app.use(express.json());

// Mock auth middleware pour les tests
app.use((req, res, next) => {
  req.userId = req.headers['user-id'] || 'test-user-id';
  next();
});

// Routes de test
app.post('/send-notification', notificationController.sendNotification);
app.post('/send-bulk-notifications', notificationController.sendBulkNotifications);
app.post('/send-topic-notification', notificationController.sendTopicNotification);
app.post('/register-fcm-token', notificationController.registerFCMToken);
app.post('/unregister-fcm-token', notificationController.unregisterFCMToken);
app.post('/subscribe-topic', notificationController.subscribeToTopic);
app.post('/unsubscribe-topic', notificationController.unsubscribeFromTopic);
app.get('/notification-preferences', notificationController.getNotificationPreferences);
app.put('/notification-preferences', notificationController.updateNotificationPreferences);
app.get('/notification-history', notificationController.getNotificationHistory);
app.get('/notification-templates', notificationController.getNotificationTemplates);
app.post('/send-template-notification', notificationController.sendTemplateNotification);
app.get('/service-status', notificationController.getServiceStatus);
app.post('/test-notification', notificationController.testNotification);

describe('Notification Controller', () => {
  let mongoServer;
  let testUserId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    
    // Créer utilisateur de test
    const testUser = new User({
      email: 'test@example.com',
      password: 'Password123!',
      prenom: 'Test',
      notificationPreferences: {
        enabled: true,
        types: {
          welcome: true,
          reminder: true,
          achievement: true
        }
      },
      fcmTokens: [],
      notificationHistory: []
    });
    const savedUser = await testUser.save();
    testUserId = savedUser._id.toString();

    // Reset des mocks
    jest.clearAllMocks();
  });

  describe('POST /send-notification', () => {
    it('devrait envoyer une notification avec succès', async () => {
      const mockResult = { success: true, messageId: 'test-message-id' };
      firebaseService.sendNotificationToUser.mockResolvedValue(mockResult);

      const notificationData = {
        userId: testUserId,
        notification: {
          title: 'Test Notification',
          body: 'Ceci est un test'
        },
        options: {}
      };

      const response = await request(app)
        .post('/send-notification')
        .send(notificationData)
        .expect(200);

      expect(response.body.message).toBe('Notification envoyée avec succès');
      expect(response.body.result).toEqual(mockResult);
      expect(firebaseService.sendNotificationToUser).toHaveBeenCalledWith(
        testUserId,
        notificationData.notification
      );
    });

    it('devrait rejeter une notification sans titre', async () => {
      const response = await request(app)
        .post('/send-notification')
        .send({
          userId: testUserId,
          notification: { body: 'Corps sans titre' }
        })
        .expect(400);

      expect(response.body.message).toContain('userId, notification.title et notification.body sont requis');
    });

    it('devrait gérer les échecs du service', async () => {
      const mockResult = { success: false, error: 'Service indisponible' };
      notificationService.sendNotification.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/send-notification')
        .send({
          userId: testUserId,
          notification: {
            title: 'Test',
            body: 'Test'
          }
        })
        .expect(400);

      expect(response.body.message).toBe('Échec envoi notification');
      expect(response.body.error).toBe('Service indisponible');
    });
  });

  describe('POST /send-bulk-notifications', () => {
    it('devrait envoyer des notifications groupées', async () => {
      const mockResult = { success: 3, failed: 0, total: 3 };
      notificationService.sendBulkNotifications.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/send-bulk-notifications')
        .send({
          userIds: [testUserId, 'user2', 'user3'],
          notification: {
            title: 'Notification Groupée',
            body: 'Message pour tous'
          }
        })
        .expect(200);

      expect(response.body.message).toBe('Notifications groupées envoyées');
      expect(response.body.result).toEqual(mockResult);
    });

    it('devrait rejeter une liste userIds vide', async () => {
      const response = await request(app)
        .post('/send-bulk-notifications')
        .send({
          userIds: [],
          notification: { title: 'Test', body: 'Test' }
        })
        .expect(400);

      expect(response.body.message).toBe('Liste userIds non vide requise');
    });
  });

  describe('POST /register-fcm-token', () => {
    it('devrait enregistrer un token FCM', async () => {
      const mockResult = { success: true, tokenId: 'token-123' };
      notificationService.registerFCMToken.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/register-fcm-token')
        .set('user-id', testUserId)
        .send({
          token: 'fcm-token-12345',
          deviceInfo: { type: 'mobile', platform: 'ios' }
        })
        .expect(200);

      expect(response.body.message).toBe('Token FCM enregistré avec succès');
      expect(notificationService.registerFCMToken).toHaveBeenCalledWith(
        testUserId,
        'fcm-token-12345',
        { type: 'mobile', platform: 'ios' }
      );
    });

    it('devrait rejeter une requête sans token', async () => {
      const response = await request(app)
        .post('/register-fcm-token')
        .set('user-id', testUserId)
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Token FCM requis');
    });
  });

  describe('GET /notification-preferences', () => {
    it('devrait retourner les préférences utilisateur', async () => {
      const response = await request(app)
        .get('/notification-preferences')
        .set('user-id', testUserId)
        .expect(200);

      expect(response.body.message).toBe('Préférences de notifications récupérées');
      expect(response.body.preferences).toBeDefined();
      expect(response.body.preferences.enabled).toBe(true);
      expect(response.body.tokens).toBeDefined();
      expect(response.body.subscriptions).toBeDefined();
    });

    it('devrait retourner 404 pour utilisateur inexistant', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app)
        .get('/notification-preferences')
        .set('user-id', fakeUserId)
        .expect(404);

      expect(response.body.message).toBe('Utilisateur non trouvé');
    });
  });

  describe('PUT /notification-preferences', () => {
    it('devrait mettre à jour les préférences', async () => {
      const newPreferences = {
        enabled: false,
        types: {
          welcome: false,
          reminder: true,
          achievement: true
        }
      };

      const response = await request(app)
        .put('/notification-preferences')
        .set('user-id', testUserId)
        .send({ preferences: newPreferences })
        .expect(200);

      expect(response.body.message).toBe('Préférences mises à jour avec succès');
      expect(response.body.preferences.enabled).toBe(false);
      expect(response.body.preferences.types.welcome).toBe(false);
    });

    it('devrait rejeter des préférences invalides', async () => {
      const response = await request(app)
        .put('/notification-preferences')
        .set('user-id', testUserId)
        .send({ preferences: null })
        .expect(400);

      expect(response.body.message).toBe('Objet preferences requis');
    });
  });

  describe('GET /notification-templates', () => {
    it('devrait retourner les modèles disponibles', async () => {
      const mockTemplates = {
        welcome: { title: 'Bienvenue!', body: 'Bienvenue dans AVA', type: 'welcome' },
        reminder: { title: 'Rappel', body: 'N\'oubliez pas...', type: 'reminder' }
      };
      
      notificationService.getNotificationTemplates.mockReturnValue(mockTemplates);

      const response = await request(app)
        .get('/notification-templates')
        .expect(200);

      expect(response.body.message).toBe('Modèles de notifications récupérés');
      expect(response.body.templates).toEqual(mockTemplates);
    });
  });

  describe('POST /test-notification', () => {
    it('devrait envoyer une notification de test', async () => {
      const mockResult = { success: true, messageId: 'test-123' };
      notificationService.sendNotification.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/test-notification')
        .set('user-id', testUserId)
        .send({ message: 'Message de test personnalisé' })
        .expect(200);

      expect(response.body.message).toBe('Notification de test envoyée');
      expect(response.body.result).toEqual(mockResult);
    });
  });

  describe('GET /service-status', () => {
    it('devrait retourner le statut du service', async () => {
      const mockStatus = {
        status: 'operational',
        version: '1.0.0',
        uptime: '2 days',
        connections: { fcm: true, email: true }
      };
      
      notificationService.getServiceStatus.mockReturnValue(mockStatus);

      const response = await request(app)
        .get('/service-status')
        .expect(200);

      expect(response.body.message).toBe('Statut du service de notifications');
      expect(response.body.status).toEqual(mockStatus);
    });
  });
});