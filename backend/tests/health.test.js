const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Health API Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Utiliser une base de données de test
    const testDB = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ava-app-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDB);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    // Nettoyer les collections
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }

    // Créer un utilisateur test et obtenir un token
    const userData = {
      email: 'health-test@example.com',
      password: 'Test123!',
      prenom: 'HealthTest'
    };

    const registerResponse = await request(app)
      .post('/api/user/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/user/login')
      .send({ email: userData.email, password: userData.password });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user._id;
  });

  describe('POST /api/health', () => {
    it('should save health data with valid input', async () => {
      const healthData = {
        sommeil: 75,
        stress: 30,
        hydratation: 80,
        energie: 70,
        activite: 60
      };

      const response = await request(app)
        .post('/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .send(healthData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data.sommeil).toBe(healthData.sommeil);
    });

    it('should reject invalid health values', async () => {
      const healthData = {
        sommeil: 150, // Invalid: > 100
        stress: -10,  // Invalid: < 0
        hydratation: 80,
        energie: 70,
        activite: 60
      };

      const response = await request(app)
        .post('/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .send(healthData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Données invalides');
    });

    it('should require authentication', async () => {
      const healthData = {
        sommeil: 75,
        stress: 30,
        hydratation: 80
      };

      const response = await request(app)
        .post('/api/health')
        .send(healthData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/health', () => {
    beforeEach(async () => {
      // Ajouter des données de santé
      const healthData = {
        sommeil: 75,
        stress: 30,
        hydratation: 80,
        energie: 70,
        activite: 60
      };

      await request(app)
        .post('/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .send(healthData);
    });

    it('should retrieve user health data', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});