const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const subscriptionController = require('../../src/api/subscription/subscription.controller');
const User = require('../../src/models/user.model');
const { authMiddleware } = require('../../src/middlewares/auth.middleware');

// Mock du service de paiement pour éviter les appels réels à Stripe
jest.mock('../../src/services/payment.service', () => ({
  createCheckoutSession: jest.fn().mockResolvedValue({
    sessionId: 'cs_test_123',
    sessionUrl: 'https://checkout.stripe.com/test',
    customerId: 'cus_test_123'
  }),
  cancelSubscription: jest.fn().mockResolvedValue({
    message: 'Abonnement annulé avec succès',
    subscriptionLevel: 'explore'
  }),
  getPaymentHistory: jest.fn().mockResolvedValue({
    invoices: []
  }),
  createPortalSession: jest.fn().mockResolvedValue({
    portalUrl: 'https://billing.stripe.com/test'
  }),
  handleWebhook: jest.fn().mockResolvedValue({ received: true })
}));

const app = express();
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Mock middleware auth pour simuler un utilisateur connecté
const mockAuthMiddleware = (req, res, next) => {
  req.userId = 'test-user-id';
  req.user = { _id: 'test-user-id', email: 'test@example.com' };
  next();
};

// Routes de test
app.get('/subscription', mockAuthMiddleware, subscriptionController.getCurrentSubscription);
app.post('/subscription/create-session', mockAuthMiddleware, subscriptionController.createPaymentSession);
app.post('/subscription/cancel', mockAuthMiddleware, subscriptionController.cancelSubscription);
app.get('/subscription/history', mockAuthMiddleware, subscriptionController.getPaymentHistory);
app.post('/subscription/portal', mockAuthMiddleware, subscriptionController.createPortalSession);
app.post('/subscription/webhook/stripe', subscriptionController.handleStripeWebhook);

describe('Subscription Controller', () => {
  let mongoServer;
  let testUser;

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
    testUser = new User({
      _id: 'test-user-id',
      email: 'test@example.com',
      password: 'hashedpassword',
      subscriptionLevel: 'explore',
      subscriptionStatus: 'active'
    });
    await testUser.save();
    jest.clearAllMocks();
  });

  describe('GET /subscription', () => {
    it('should get current subscription successfully', async () => {
      const response = await request(app)
        .get('/subscription')
        .expect(200);

      expect(response.body.subscriptionLevel).toBe('explore');
      expect(response.body.features).toBeDefined();
      expect(Array.isArray(response.body.features)).toBe(true);
      expect(response.body.nextRenewalDate).toBeDefined();
    });

    it('should handle non-existent user', async () => {
      await User.findByIdAndDelete('test-user-id');

      const response = await request(app)
        .get('/subscription')
        .expect(404);

      expect(response.body.message).toContain('non trouvé');
    });
  });

  describe('POST /subscription/create-session', () => {
    it('should create payment session for valid subscription level', async () => {
      const sessionData = {
        level: 'pro',
        billingPeriod: 'monthly'
      };

      const response = await request(app)
        .post('/subscription/create-session')
        .send(sessionData)
        .expect(200);

      expect(response.body.message).toBe('Session de paiement créée');
      expect(response.body.sessionId).toBe('cs_test_123');
      expect(response.body.sessionUrl).toBeDefined();
      expect(response.body.customerId).toBeDefined();
    });

    it('should reject invalid subscription level', async () => {
      const sessionData = {
        level: 'invalid-level',
        billingPeriod: 'monthly'
      };

      const response = await request(app)
        .post('/subscription/create-session')
        .send(sessionData)
        .expect(400);

      expect(response.body.message).toContain('invalide');
    });

    it('should reject invalid billing period', async () => {
      const sessionData = {
        level: 'pro',
        billingPeriod: 'invalid-period'
      };

      const response = await request(app)
        .post('/subscription/create-session')
        .send(sessionData)
        .expect(400);

      expect(response.body.message).toContain('invalide');
    });

    it('should default to monthly billing if not specified', async () => {
      const sessionData = {
        level: 'pro'
      };

      const response = await request(app)
        .post('/subscription/create-session')
        .send(sessionData)
        .expect(200);

      expect(response.body.message).toBe('Session de paiement créée');
    });
  });

  describe('POST /subscription/cancel', () => {
    it('should cancel subscription successfully', async () => {
      const response = await request(app)
        .post('/subscription/cancel')
        .expect(200);

      expect(response.body.message).toBe('Abonnement annulé avec succès');
      expect(response.body.subscriptionLevel).toBe('explore');
    });
  });

  describe('GET /subscription/history', () => {
    it('should get payment history successfully', async () => {
      const response = await request(app)
        .get('/subscription/history')
        .expect(200);

      expect(response.body.invoices).toBeDefined();
      expect(Array.isArray(response.body.invoices)).toBe(true);
    });
  });

  describe('POST /subscription/portal', () => {
    it('should create portal session successfully', async () => {
      const response = await request(app)
        .post('/subscription/portal')
        .expect(200);

      expect(response.body.portalUrl).toBeDefined();
      expect(response.body.portalUrl).toContain('billing.stripe.com');
    });
  });

  describe('POST /subscription/webhook/stripe', () => {
    it('should handle Stripe webhook successfully', async () => {
      const webhookData = {
        id: 'evt_test_123',
        type: 'checkout.session.completed'
      };

      const response = await request(app)
        .post('/subscription/webhook/stripe')
        .set('stripe-signature', 'test-signature')
        .send(webhookData)
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should reject webhook without signature', async () => {
      const webhookData = {
        id: 'evt_test_123',
        type: 'checkout.session.completed'
      };

      const response = await request(app)
        .post('/subscription/webhook/stripe')
        .send(webhookData)
        .expect(400);

      expect(response.body.error).toContain('Signature manquante');
    });
  });
});