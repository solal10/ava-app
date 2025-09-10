const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const iaController = require('../../src/api/ia/ia.controller');
const User = require('../../src/models/user.model');

// Mock AI service
jest.mock('../../src/services/ai-chat.service', () => ({
  generateResponse: jest.fn(),
  analyzeConversationTrends: jest.fn()
}));

const aiChatService = require('../../src/services/ai-chat.service');

const app = express();
app.use(express.json());

// Mock auth middleware pour les tests
app.use((req, res, next) => {
  req.userId = req.headers['user-id'] || 'test-user-id';
  req.subscriptionLevel = req.headers['subscription-level'] || 'explore';
  req.user = { email: 'test@example.com', id: req.userId };
  next();
});

// Routes de test
app.post('/ask-coach', iaController.askCoach);
app.get('/conversation-history', iaController.getConversationHistory);
app.get('/conversation-analytics', iaController.getConversationAnalytics);
app.post('/feedback', iaController.provideFeedback);
app.delete('/conversation-history', iaController.clearConversationHistory);
app.get('/usage-limits', iaController.getUsageLimits);

describe('IA Controller', () => {
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
      stats: {
        weight: 70,
        height: 175,
        age: 30
      }
    });
    const savedUser = await testUser.save();
    testUserId = savedUser._id.toString();

    // Reset des mocks
    jest.clearAllMocks();
  });

  describe('POST /ask-coach', () => {
    it('devrait traiter une question santé avec succès', async () => {
      const mockAIResponse = {
        response: 'Basé sur votre profil, je recommande...',
        provider: 'claude',
        model: 'claude-3-sonnet',
        tokens: 50,
        cost: 0.001,
        intent: 'health_advice',
        confidence: 0.95,
        subscription_gated: false
      };

      aiChatService.generateResponse.mockResolvedValue(mockAIResponse);

      const response = await request(app)
        .post('/ask-coach')
        .set('user-id', testUserId)
        .set('subscription-level', 'pro')
        .send({
          question: 'Comment améliorer ma qualité de sommeil?',
          responseType: 'health_coach'
        })
        .expect(200);

      expect(response.body.question).toBe('Comment améliorer ma qualité de sommeil?');
      expect(response.body.response).toBe(mockAIResponse.response);
      expect(response.body.metadata.provider).toBe('claude');
      expect(response.body.subscription.level).toBe('pro');
    });

    it('devrait rejeter une question vide', async () => {
      const response = await request(app)
        .post('/ask-coach')
        .set('user-id', testUserId)
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Question manquante');
    });

    it('devrait enforcer les limites abonnement explore', async () => {
      aiChatService.generateResponse.mockResolvedValue({
        response: 'Réponse test',
        provider: 'claude'
      });

      // 3 requêtes (devraient réussir)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/ask-coach')
          .set('user-id', testUserId)
          .set('subscription-level', 'explore')
          .send({ question: `Question ${i + 1}` })
          .expect(200);
      }

      // 4ème requête devrait être rejetée
      const response = await request(app)
        .post('/ask-coach')
        .set('user-id', testUserId)
        .set('subscription-level', 'explore')
        .send({ question: 'Ceci devrait échouer' })
        .expect(403);

      expect(response.body.message).toContain('Limite de 3 questions');
      expect(response.body.upgrade).toBe(true);
    });
  });

  describe('GET /conversation-history', () => {
    it('devrait retourner un historique vide pour nouvel utilisateur', async () => {
      const response = await request(app)
        .get('/conversation-history')
        .set('user-id', testUserId)
        .expect(200);

      expect(response.body.userId).toBe(testUserId);
      expect(response.body.conversationCount).toBe(0);
      expect(response.body.recentConversations).toEqual([]);
    });
  });

  describe('GET /conversation-analytics', () => {
    it('devrait exiger un abonnement premium', async () => {
      const response = await request(app)
        .get('/conversation-analytics')
        .set('user-id', testUserId)
        .set('subscription-level', 'explore')
        .expect(403);

      expect(response.body.message).toContain('Fonctionnalité réservée aux abonnements Pro et Elite');
      expect(response.body.upgrade).toBe(true);
    });
  });

  describe('POST /feedback', () => {
    it('devrait enregistrer le feedback avec succès', async () => {
      const feedbackData = {
        conversationId: 'test-conversation-123',
        rating: 5,
        feedback: 'Réponse très utile!',
        helpful: true
      };

      const response = await request(app)
        .post('/feedback')
        .set('user-id', testUserId)
        .send(feedbackData)
        .expect(200);

      expect(response.body.message).toContain('Merci pour votre retour');
      expect(response.body.recorded).toBe(true);
    });
  });

  describe('GET /usage-limits', () => {
    it('devrait retourner les limites pour abonnement explore', async () => {
      const response = await request(app)
        .get('/usage-limits')
        .set('user-id', testUserId)
        .set('subscription-level', 'explore')
        .expect(200);

      expect(response.body.subscriptionLevel).toBe('explore');
      expect(response.body.limits.questionsPerWeek).toBe(3);
      expect(response.body.limits.maxTokensPerResponse).toBe(150);
    });
  });
});