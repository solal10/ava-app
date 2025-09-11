const sentryService = require('../../src/services/sentry.service');

// Mock Sentry
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn(callback => callback({
    setUser: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
    setLevel: jest.fn()
  })),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  startTransaction: jest.fn(),
  flush: jest.fn(),
  close: jest.fn(),
  Handlers: {
    requestHandler: jest.fn(() => (req, res, next) => next()),
    errorHandler: jest.fn(() => (err, req, res, next) => next(err)),
    tracingHandler: jest.fn(() => (req, res, next) => next())
  },
  Integrations: {
    Http: jest.fn(),
    Express: jest.fn(),
    Mongo: jest.fn(),
    OnUncaughtException: jest.fn(),
    OnUnhandledRejection: jest.fn()
  }
}));

describe('Sentry Service', () => {
  const originalEnv = process.env.SENTRY_DSN;

  afterEach(() => {
    process.env.SENTRY_DSN = originalEnv;
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('devrait s\'initialiser avec un DSN valide', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      const result = sentryService.initialize();
      expect(result).toBe(true);
    });

    it('devrait échouer sans DSN', () => {
      delete process.env.SENTRY_DSN;
      const result = sentryService.initialize();
      expect(result).toBe(false);
    });
  });

  describe('captureException', () => {
    beforeEach(() => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      sentryService.initialize();
    });

    it('devrait capturer une exception simple', () => {
      const error = new Error('Test error');
      const result = sentryService.captureException(error);
      expect(result).toBeDefined();
    });

    it('devrait capturer une exception avec contexte', () => {
      const error = new Error('Test error with context');
      const context = {
        user: { id: 'user123', email: 'test@example.com' },
        tags: { component: 'test' },
        extra: { data: 'test data' },
        level: 'error'
      };
      
      const result = sentryService.captureException(error, context);
      expect(result).toBeDefined();
    });
  });

  describe('captureMessage', () => {
    beforeEach(() => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      sentryService.initialize();
    });

    it('devrait capturer un message simple', () => {
      const result = sentryService.captureMessage('Test message');
      expect(result).toBeDefined();
    });

    it('devrait capturer un message avec niveau et contexte', () => {
      const context = {
        user: { id: 'user123' },
        tags: { feature: 'test' }
      };
      
      const result = sentryService.captureMessage('Test message with context', 'warning', context);
      expect(result).toBeDefined();
    });
  });

  describe('middleware handlers', () => {
    beforeEach(() => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      sentryService.initialize();
    });

    it('devrait retourner un request handler', () => {
      const handler = sentryService.getRequestHandler();
      expect(typeof handler).toBe('function');
    });

    it('devrait retourner un error handler', () => {
      const handler = sentryService.getErrorHandler();
      expect(typeof handler).toBe('function');
    });

    it('devrait retourner un tracing handler', () => {
      const handler = sentryService.getTracingHandler();
      expect(typeof handler).toBe('function');
    });
  });

  describe('transactions et performance', () => {
    beforeEach(() => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      sentryService.initialize();
    });

    it('devrait démarrer une transaction', () => {
      const transaction = sentryService.startTransaction('test-transaction', 'test-op', 'Test transaction');
      expect(transaction).toBeDefined();
    });

    it('devrait ajouter des breadcrumbs', () => {
      sentryService.addBreadcrumb('Test breadcrumb', 'navigation', 'info', { test: true });
      // Pas d'exception = succès
      expect(true).toBe(true);
    });

    it('devrait capturer des métriques de performance', () => {
      sentryService.capturePerformanceMetric('api_response_time', 150, 'ms', { endpoint: '/test' });
      // Pas d'exception = succès
      expect(true).toBe(true);
    });
  });

  describe('méthodes spécialisées pour AVA Coach Santé', () => {
    beforeEach(() => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      sentryService.initialize();
    });

    it('devrait capturer les erreurs Garmin', () => {
      const error = new Error('Garmin API error');
      const result = sentryService.captureGarminError(error, 'user123', 'sync_data');
      expect(result).toBeDefined();
    });

    it('devrait capturer les erreurs IA', () => {
      const error = new Error('AI service error');
      const result = sentryService.captureAIError(error, 'openai', 'user123', 'test query');
      expect(result).toBeDefined();
    });

    it('devrait capturer les erreurs de paiement', () => {
      const error = new Error('Payment failed');
      const result = sentryService.capturePaymentError(error, 'user123', 1999, 'EUR');
      expect(result).toBeDefined();
    });
  });

  describe('configuration et statut', () => {
    it('devrait retourner le statut du service', () => {
      const status = sentryService.getStatus();
      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('release');
      expect(status).toHaveProperty('hasDSN');
    });

    it('devrait configurer l\'utilisateur', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      sentryService.initialize();
      
      const user = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        subscription: { plan: 'pro' }
      };
      
      sentryService.setUser(user);
      // Pas d'exception = succès
      expect(true).toBe(true);
    });

    it('devrait ajouter des tags', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      sentryService.initialize();
      
      sentryService.setTag('component', 'test');
      sentryService.setExtra('metadata', { test: true });
      // Pas d'exception = succès
      expect(true).toBe(true);
    });
  });

  describe('gestion sans DSN', () => {
    beforeEach(() => {
      delete process.env.SENTRY_DSN;
      sentryService.initialize();
    });

    it('devrait gérer les appels sans crash quand non initialisé', () => {
      const error = new Error('Test error');
      
      // Ces appels ne devraient pas lever d'exception
      sentryService.captureException(error);
      sentryService.captureMessage('Test message');
      sentryService.addBreadcrumb('Test breadcrumb');
      sentryService.setUser({ id: 'test' });
      sentryService.setTag('test', 'value');
      sentryService.setExtra('test', 'value');
      
      expect(true).toBe(true);
    });

    it('devrait retourner des handlers par défaut', () => {
      const requestHandler = sentryService.getRequestHandler();
      const errorHandler = sentryService.getErrorHandler();
      const tracingHandler = sentryService.getTracingHandler();
      
      expect(typeof requestHandler).toBe('function');
      expect(typeof errorHandler).toBe('function');
      expect(typeof tracingHandler).toBe('function');
    });
  });
});