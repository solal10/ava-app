const PaymentService = require('../../src/services/payment.service');

// Mock Stripe
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn()
    }
  },
  webhookEndpoints: {
    create: jest.fn()
  },
  customers: {
    create: jest.fn(),
    retrieve: jest.fn()
  },
  subscriptions: {
    create: jest.fn(),
    cancel: jest.fn(),
    retrieve: jest.fn()
  }
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

// Mock User model
jest.mock('../../src/models/user.model', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

const User = require('../../src/models/user.model');

describe('Payment Service', () => {
  let paymentService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
    paymentService = new PaymentService();
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe('initialization', () => {
    it('devrait s\'initialiser avec une clé Stripe valide', () => {
      expect(paymentService).toBeDefined();
    });

    it('devrait gérer l\'absence de clé Stripe', () => {
      delete process.env.STRIPE_SECRET_KEY;
      const serviceWithoutKey = new PaymentService();
      expect(serviceWithoutKey).toBeDefined();
    });
  });

  describe('createCheckoutSession', () => {
    beforeEach(() => {
      User.findById.mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser'
      });

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      });
    });

    it('devrait créer une session de checkout pour un abonnement mensuel', async () => {
      const result = await paymentService.createCheckoutSession('user123', 'pro', 'monthly');

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('cs_test_123');
      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 1999 // Pro monthly price
              })
            })
          ])
        })
      );
    });

    it('devrait créer une session pour un abonnement annuel', async () => {
      const result = await paymentService.createCheckoutSession('user123', 'pro', 'yearly');

      expect(result.success).toBe(true);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 19999, // Pro yearly price
                recurring: expect.objectContaining({
                  interval: 'year'
                })
              })
            })
          ])
        })
      );
    });

    it('devrait rejeter les niveaux d\'abonnement invalides', async () => {
      await expect(
        paymentService.createCheckoutSession('user123', 'invalid_level', 'monthly')
      ).rejects.toThrow('Niveau d\'abonnement invalide');
    });

    it('devrait rejeter l\'abonnement gratuit', async () => {
      await expect(
        paymentService.createCheckoutSession('user123', 'explore', 'monthly')
      ).rejects.toThrow('L\'abonnement Explore est gratuit');
    });

    it('devrait gérer les utilisateurs inexistants', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        paymentService.createCheckoutSession('nonexistent', 'pro', 'monthly')
      ).rejects.toThrow('Utilisateur non trouvé');
    });

    it('devrait gérer les erreurs Stripe', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe error'));

      await expect(
        paymentService.createCheckoutSession('user123', 'pro', 'monthly')
      ).rejects.toThrow('Stripe error');
    });
  });

  describe('handleWebhook', () => {
    it('devrait traiter un webhook de paiement réussi', async () => {
      const webhookData = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_email: 'test@example.com',
            metadata: {
              userId: 'user123',
              subscriptionLevel: 'pro',
              billingPeriod: 'monthly'
            }
          }
        }
      };

      User.findById.mockResolvedValue({
        _id: 'user123',
        save: jest.fn().mockResolvedValue(true)
      });

      const result = await paymentService.handleWebhook(webhookData);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
    });

    it('devrait traiter un webhook d\'échec de paiement', async () => {
      const webhookData = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            metadata: {
              userId: 'user123'
            }
          }
        }
      };

      const result = await paymentService.handleWebhook(webhookData);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
    });

    it('devrait ignorer les webhooks non pertinents', async () => {
      const webhookData = {
        type: 'unrelated.event',
        data: { object: {} }
      };

      const result = await paymentService.handleWebhook(webhookData);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(false);
    });
  });

  describe('cancelSubscription', () => {
    beforeEach(() => {
      User.findById.mockResolvedValue({
        _id: 'user123',
        subscription: {
          stripeSubscriptionId: 'sub_123'
        },
        save: jest.fn().mockResolvedValue(true)
      });

      mockStripe.subscriptions.cancel.mockResolvedValue({
        id: 'sub_123',
        status: 'canceled'
      });
    });

    it('devrait annuler un abonnement', async () => {
      const result = await paymentService.cancelSubscription('user123');

      expect(result.success).toBe(true);
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123');
    });

    it('devrait gérer les utilisateurs sans abonnement', async () => {
      User.findById.mockResolvedValue({
        _id: 'user123',
        subscription: {}
      });

      await expect(
        paymentService.cancelSubscription('user123')
      ).rejects.toThrow('Aucun abonnement actif trouvé');
    });
  });

  describe('getSubscriptionDetails', () => {
    it('devrait retourner les détails d\'un abonnement', async () => {
      User.findById.mockResolvedValue({
        _id: 'user123',
        subscription: {
          stripeSubscriptionId: 'sub_123',
          plan: 'pro',
          status: 'active'
        }
      });

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        current_period_end: 1234567890
      });

      const result = await paymentService.getSubscriptionDetails('user123');

      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(result.subscription.plan).toBe('pro');
    });
  });

  describe('createCustomer', () => {
    it('devrait créer un client Stripe', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser'
      };

      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_123',
        email: 'test@example.com'
      });

      const result = await paymentService.createCustomer(userData);

      expect(result.success).toBe(true);
      expect(result.customerId).toBe('cus_123');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'testuser',
        metadata: {
          username: 'testuser'
        }
      });
    });
  });

  describe('validateWebhookSignature', () => {
    it('devrait valider une signature de webhook', () => {
      const payload = 'test payload';
      const signature = 'test_signature';
      const secret = 'whsec_test';

      // Mock la validation Stripe
      jest.spyOn(paymentService, 'validateWebhookSignature').mockReturnValue(true);

      const isValid = paymentService.validateWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });
  });

  describe('subscription plans', () => {
    it('devrait retourner les prix des abonnements', () => {
      const prices = paymentService.getSubscriptionPrices();

      expect(prices).toHaveProperty('explore');
      expect(prices).toHaveProperty('perform');
      expect(prices).toHaveProperty('pro');
      expect(prices).toHaveProperty('elite');
      
      expect(prices.pro.monthly).toBe(1999);
      expect(prices.pro.yearly).toBe(19999);
    });

    it('devrait retourner les métadonnées des abonnements', () => {
      const metadata = paymentService.getSubscriptionMetadata();

      expect(metadata).toHaveProperty('pro');
      expect(metadata.pro).toHaveProperty('name');
      expect(metadata.pro).toHaveProperty('features');
      expect(Array.isArray(metadata.pro.features)).toBe(true);
    });
  });

  describe('mode sans Stripe', () => {
    beforeEach(() => {
      delete process.env.STRIPE_SECRET_KEY;
      paymentService = new PaymentService();
    });

    it('devrait gérer les appels sans Stripe configuré', async () => {
      await expect(
        paymentService.createCheckoutSession('user123', 'pro', 'monthly')
      ).rejects.toThrow('Service de paiement non configuré');
    });
  });
});