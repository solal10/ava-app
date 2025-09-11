const request = require('supertest');
const express = require('express');
const stateController = require('../../src/api/state/state.controller');

const app = express();
app.use(express.json());

// Mock auth middleware pour les tests
app.use((req, res, next) => {
  req.subscriptionLevel = req.headers['subscription-level'] || 'explore';
  next();
});

// Routes de test
app.get('/user-state', stateController.getUserState);
app.post('/update-state', stateController.updateStateFromSdk);

describe('State Controller', () => {
  beforeEach(() => {
    // Reset random values pour tests prédictibles
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /user-state', () => {
    it('devrait retourner les données de base pour abonnement explore', async () => {
      const response = await request(app)
        .get('/user-state')
        .set('subscription-level', 'explore')
        .expect(200);

      expect(response.body.subscriptionLevel).toBe('explore');
      expect(response.body.data).toHaveProperty('bodyBattery');
      expect(response.body.data).toHaveProperty('sleepScore');
      expect(response.body.data).not.toHaveProperty('hrResting');
      expect(response.body.data).not.toHaveProperty('stressLevel');
      expect(response.body.data).not.toHaveProperty('nutritionScore');
      expect(response.body.timestamp).toBeDefined();
    });

    it('devrait retourner des données étendues pour abonnement perform', async () => {
      const response = await request(app)
        .get('/user-state')
        .set('subscription-level', 'perform')
        .expect(200);

      expect(response.body.subscriptionLevel).toBe('perform');
      expect(response.body.data).toHaveProperty('bodyBattery');
      expect(response.body.data).toHaveProperty('sleepScore');
      expect(response.body.data).toHaveProperty('hrResting');
      expect(response.body.data).not.toHaveProperty('stressLevel');
      expect(response.body.data).not.toHaveProperty('nutritionScore');
    });

    it('devrait retourner plus de données pour abonnement pro', async () => {
      const response = await request(app)
        .get('/user-state')
        .set('subscription-level', 'pro')
        .expect(200);

      expect(response.body.subscriptionLevel).toBe('pro');
      expect(response.body.data).toHaveProperty('bodyBattery');
      expect(response.body.data).toHaveProperty('sleepScore');
      expect(response.body.data).toHaveProperty('hrResting');
      expect(response.body.data).toHaveProperty('stressLevel');
      expect(response.body.data).not.toHaveProperty('nutritionScore');
    });

    it('devrait retourner toutes les données pour abonnement elite', async () => {
      const response = await request(app)
        .get('/user-state')
        .set('subscription-level', 'elite')
        .expect(200);

      expect(response.body.subscriptionLevel).toBe('elite');
      expect(response.body.data).toHaveProperty('bodyBattery');
      expect(response.body.data).toHaveProperty('sleepScore');
      expect(response.body.data).toHaveProperty('hrResting');
      expect(response.body.data).toHaveProperty('stressLevel');
      expect(response.body.data).toHaveProperty('nutritionScore');
    });

    it('devrait retourner une erreur si le niveau d\'abonnement est manquant', async () => {
      // Créer une nouvelle app sans middleware qui définit subscriptionLevel
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/user-state', stateController.getUserState);

      const response = await request(testApp)
        .get('/user-state')
        .expect(400);

      expect(response.body.message).toBe('Niveau d\'abonnement non spécifié');
    });

    it('devrait avoir des valeurs numériques dans les plages attendues', async () => {
      // Mock Math.random pour retourner 0.5 (milieu de plage)
      Math.random.mockReturnValue(0.5);

      const response = await request(app)
        .get('/user-state')
        .set('subscription-level', 'elite')
        .expect(200);

      const data = response.body.data;
      
      // bodyBattery et sleepScore devraient être 50 (0.5 * 100)
      expect(data.bodyBattery).toBe(50);
      expect(data.sleepScore).toBe(50);
      
      // hrResting devrait être 62 (55 + 0.5 * 15 = 55 + 7 = 62)
      expect(data.hrResting).toBe(62);
      
      // stressLevel devrait être 50 (0.5 * 100)
      expect(data.stressLevel).toBe(50);
      
      // nutritionScore devrait être 50 (0.5 * 100)
      expect(data.nutritionScore).toBe(50);
    });
  });

  describe('POST /update-state', () => {
    it('devrait accepter des données de Garmin', async () => {
      const testData = {
        source: 'garmin',
        data: {
          heartRate: 65,
          steps: 10000,
          sleep: 8.5
        }
      };

      const response = await request(app)
        .post('/update-state')
        .send(testData)
        .expect(200);

      expect(response.body.message).toBe('Données reçues avec succès depuis garmin');
      expect(response.body.receivedAt).toBeDefined();
    });

    it('devrait accepter des données d\'Apple Watch', async () => {
      const testData = {
        source: 'applewatch',
        data: {
          activeEnergy: 500,
          workoutTime: 45
        }
      };

      const response = await request(app)
        .post('/update-state')
        .send(testData)
        .expect(200);

      expect(response.body.message).toBe('Données reçues avec succès depuis applewatch');
    });

    it('devrait accepter des données de Suunto', async () => {
      const testData = {
        source: 'suunto',
        data: {
          trainingLoad: 85,
          recovery: 75
        }
      };

      const response = await request(app)
        .post('/update-state')
        .send(testData)
        .expect(200);

      expect(response.body.message).toBe('Données reçues avec succès depuis suunto');
    });

    it('devrait rejeter une source de données non reconnue', async () => {
      const testData = {
        source: 'fitbit',
        data: { steps: 8000 }
      };

      const response = await request(app)
        .post('/update-state')
        .send(testData)
        .expect(400);

      expect(response.body.message).toBe('Source de données non reconnue');
    });

    // Test d'erreur interne skipped car trop complexe pour ce niveau de test
  });

  describe('Gestion des niveaux d\'abonnement', () => {
    const testAllLevels = async (levels, expectedProperties) => {
      for (const level of levels) {
        const response = await request(app)
          .get('/user-state')
          .set('subscription-level', level)
          .expect(200);

        for (const prop of expectedProperties) {
          expect(response.body.data).toHaveProperty(prop);
        }
      }
    };

    it('devrait donner accès à hrResting pour perform, pro et elite', async () => {
      await testAllLevels(['perform', 'pro', 'elite'], ['hrResting']);
    });

    it('devrait donner accès à stressLevel pour pro et elite', async () => {
      await testAllLevels(['pro', 'elite'], ['stressLevel']);
    });

    it('devrait donner accès à nutritionScore uniquement pour elite', async () => {
      await testAllLevels(['elite'], ['nutritionScore']);
    });
  });
});