// Configuration Jest pour les tests
const mongoose = require('mongoose');

// Configurer l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-tests-only-minimum-32-characters-long';
process.env.MONGODB_URI = 'mongodb://localhost:27017/ava-app-test';
process.env.SPOONACULAR_API_KEY = 'test-spoonacular-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_test-stripe-key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test-webhook-secret';

// Timeout pour les tests
jest.setTimeout(30000);

// Supprimer les warnings MongoDB
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// Mock console pour réduire le bruit dans les tests
global.console = {
  ...console,
  // Garder les erreurs importantes
  error: console.error,
  warn: console.warn,
  // Supprimer les logs de debug
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};