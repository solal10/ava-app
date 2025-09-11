const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const healthController = require('../../src/api/health/health.controller');
const User = require('../../src/models/user.model');

const app = express();
app.use(express.json());

// Mock middleware auth
const mockAuthMiddleware = (req, res, next) => {
  req.userId = 'test-user-id';
  next();
};

// Routes de test
app.post('/health/stats', mockAuthMiddleware, healthController.updateHealthStats);
app.get('/health/stats/:userId', mockAuthMiddleware, healthController.getHealthStats);
app.post('/health/goals', mockAuthMiddleware, healthController.updateHealthGoals);

describe('Health Controller', () => {
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
      stats: {
        sommeil: 70,
        stress: 50,
        hydratation: 60,
        energie: 65,
        activite: 50
      },
      goals: {
        sommeil: 80,
        stress: 30,
        hydratation: 80,
        energie: 80,
        activite: 70
      }
    });
    await testUser.save();
  });

  describe('POST /health/stats', () => {
    it('should update health stats successfully', async () => {
      const newStats = {
        sommeil: 85,
        stress: 40,
        hydratation: 75,
        energie: 80,
        activite: 65
      };

      const response = await request(app)
        .post('/health/stats')
        .send(newStats)
        .expect(200);

      expect(response.body.message).toContain('succès');
      expect(response.body.stats.sommeil).toBe(85);
      expect(response.body.stats.stress).toBe(40);

      // Vérifier que les données ont été sauvegardées
      const updatedUser = await User.findById('test-user-id');
      expect(updatedUser.stats.sommeil).toBe(85);
      expect(updatedUser.stats.stress).toBe(40);
    });

    it('should validate stat ranges', async () => {
      const invalidStats = {
        sommeil: 150, // Invalide: > 100
        stress: -10   // Invalide: < 0
      };

      const response = await request(app)
        .post('/health/stats')
        .send(invalidStats)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should handle partial updates', async () => {
      const partialStats = {
        sommeil: 90
      };

      const response = await request(app)
        .post('/health/stats')
        .send(partialStats)
        .expect(200);

      expect(response.body.stats.sommeil).toBe(90);
      
      // Vérifier que les autres stats n'ont pas changé
      const updatedUser = await User.findById('test-user-id');
      expect(updatedUser.stats.stress).toBe(50); // Valeur originale
    });
  });

  describe('GET /health/stats/:userId', () => {
    it('should get health stats successfully', async () => {
      const response = await request(app)
        .get(`/health/stats/${testUser._id}`)
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.sommeil).toBe(70);
      expect(response.body.stats.stress).toBe(50);
      expect(response.body.goals).toBeDefined();
      expect(response.body.goals.sommeil).toBe(80);
    });

    it('should handle non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/health/stats/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toContain('non trouvé');
    });
  });

  describe('POST /health/goals', () => {
    it('should update health goals successfully', async () => {
      const newGoals = {
        sommeil: 85,
        stress: 25,
        hydratation: 90,
        energie: 85,
        activite: 80
      };

      const response = await request(app)
        .post('/health/goals')
        .send(newGoals)
        .expect(200);

      expect(response.body.message).toContain('succès');
      expect(response.body.goals.sommeil).toBe(85);
      expect(response.body.goals.stress).toBe(25);

      // Vérifier que les données ont été sauvegardées
      const updatedUser = await User.findById('test-user-id');
      expect(updatedUser.goals.sommeil).toBe(85);
      expect(updatedUser.goals.stress).toBe(25);
    });

    it('should validate goal ranges', async () => {
      const invalidGoals = {
        sommeil: 150, // Invalide: > 100
        stress: -5    // Invalide: < 0
      };

      const response = await request(app)
        .post('/health/goals')
        .send(invalidGoals)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should handle partial goal updates', async () => {
      const partialGoals = {
        energie: 95
      };

      const response = await request(app)
        .post('/health/goals')
        .send(partialGoals)
        .expect(200);

      expect(response.body.goals.energie).toBe(95);
      
      // Vérifier que les autres goals n'ont pas changé
      const updatedUser = await User.findById('test-user-id');
      expect(updatedUser.goals.sommeil).toBe(80); // Valeur originale
    });
  });
});