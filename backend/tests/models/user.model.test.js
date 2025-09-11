const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../src/models/user.model');

describe('User Model', () => {
  let mongoServer;

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
  });

  describe('User creation', () => {
    it('devrait créer un utilisateur valide', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedpassword123',
        username: 'testuser',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          age: 25,
          gender: 'male',
          height: 180,
          weight: 75
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.subscriptionLevel).toBe('explore'); // default value
      expect(savedUser.profile.firstName).toBe(userData.profile.firstName);
    });

    it('devrait valider les emails uniques', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'hashedpassword123',
        username: 'user1'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User({
        ...userData,
        username: 'user2'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('devrait valider les noms d\'utilisateur uniques', async () => {
      const userData = {
        email: 'test1@example.com',
        password: 'hashedpassword123',
        username: 'duplicateuser'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User({
        ...userData,
        email: 'test2@example.com'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('devrait exiger un email valide', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'hashedpassword123',
        username: 'testuser'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('devrait définir des valeurs par défaut', async () => {
      const userData = {
        email: 'defaults@example.com',
        password: 'hashedpassword123',
        username: 'defaultuser'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.subscriptionLevel).toBe('explore');
      expect(savedUser.role).toBe('user');
      expect(savedUser.isEmailVerified).toBe(false);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.preferences).toBeDefined();
      expect(savedUser.preferences.notifications).toBeDefined();
    });
  });

  describe('Subscription management', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        email: 'subscription@example.com',
        password: 'hashedpassword123',
        username: 'subuser'
      });
      await user.save();
    });

    it('devrait mettre à jour le niveau d\'abonnement', async () => {
      user.subscriptionLevel = 'pro';
      user.subscription = {
        plan: 'pro',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
      };

      const savedUser = await user.save();
      expect(savedUser.subscriptionLevel).toBe('pro');
      expect(savedUser.subscription.plan).toBe('pro');
      expect(savedUser.subscription.status).toBe('active');
    });

    it('devrait valider les niveaux d\'abonnement', async () => {
      user.subscriptionLevel = 'invalid_level';
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User preferences', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        email: 'preferences@example.com',
        password: 'hashedpassword123',
        username: 'prefuser'
      });
      await user.save();
    });

    it('devrait mettre à jour les préférences de notification', async () => {
      user.preferences.notifications.email = false;
      user.preferences.notifications.push = true;
      user.preferences.notifications.sms = false;

      const savedUser = await user.save();
      expect(savedUser.preferences.notifications.email).toBe(false);
      expect(savedUser.preferences.notifications.push).toBe(true);
    });

    it('devrait mettre à jour les préférences de coaching', async () => {
      user.preferences.coaching = {
        intensity: 'moderate',
        frequency: 'daily',
        focusAreas: ['nutrition', 'exercise']
      };

      const savedUser = await user.save();
      expect(savedUser.preferences.coaching.intensity).toBe('moderate');
      expect(savedUser.preferences.coaching.focusAreas).toContain('nutrition');
    });
  });

  describe('Garmin integration', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        email: 'garmin@example.com',
        password: 'hashedpassword123',
        username: 'garminuser'
      });
      await user.save();
    });

    it('devrait configurer l\'intégration Garmin', async () => {
      user.garminIntegration = {
        isConnected: true,
        accessToken: 'encrypted_token',
        refreshToken: 'encrypted_refresh_token',
        connectedAt: new Date(),
        lastSyncAt: new Date(),
        garminUserId: 'garmin123'
      };

      const savedUser = await user.save();
      expect(savedUser.garminIntegration.isConnected).toBe(true);
      expect(savedUser.garminIntegration.garminUserId).toBe('garmin123');
    });
  });

  describe('User methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        email: 'methods@example.com',
        password: 'hashedpassword123',
        username: 'methoduser',
        profile: {
          firstName: 'Method',
          lastName: 'User',
          age: 30,
          height: 175,
          weight: 70
        }
      });
      await user.save();
    });

    it('devrait calculer l\'IMC', () => {
      const bmi = user.calculateBMI();
      expect(bmi).toBeCloseTo(22.86, 2); // 70 / (1.75^2)
    });

    it('devrait retourner le nom complet', () => {
      const fullName = user.getFullName();
      expect(fullName).toBe('Method User');
    });

    it('devrait vérifier les permissions d\'abonnement', () => {
      // Utilisateur explore par défaut
      expect(user.hasFeatureAccess('basic_tracking')).toBe(true);
      expect(user.hasFeatureAccess('advanced_analytics')).toBe(false);

      // Upgrade vers pro
      user.subscriptionLevel = 'pro';
      expect(user.hasFeatureAccess('advanced_analytics')).toBe(true);
    });
  });

  describe('User statistics', () => {
    beforeEach(async () => {
      // Créer plusieurs utilisateurs pour les statistiques
      const users = [
        { email: 'user1@test.com', username: 'user1', subscriptionLevel: 'explore' },
        { email: 'user2@test.com', username: 'user2', subscriptionLevel: 'pro' },
        { email: 'user3@test.com', username: 'user3', subscriptionLevel: 'elite' }
      ];

      for (const userData of users) {
        const user = new User({
          ...userData,
          password: 'hashedpassword123'
        });
        await user.save();
      }
    });

    it('devrait compter les utilisateurs par niveau d\'abonnement', async () => {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$subscriptionLevel',
            count: { $sum: 1 }
          }
        }
      ]);

      expect(stats).toHaveLength(3);
      expect(stats.find(s => s._id === 'explore').count).toBe(1);
      expect(stats.find(s => s._id === 'pro').count).toBe(1);
      expect(stats.find(s => s._id === 'elite').count).toBe(1);
    });
  });

  describe('User validation', () => {
    it('devrait valider les champs requis', async () => {
      const user = new User({});
      await expect(user.save()).rejects.toThrow();
    });

    it('devrait valider la longueur du mot de passe', async () => {
      const user = new User({
        email: 'password@test.com',
        password: '123', // Trop court
        username: 'passuser'
      });
      await expect(user.save()).rejects.toThrow();
    });

    it('devrait valider l\'âge', async () => {
      const user = new User({
        email: 'age@test.com',
        password: 'hashedpassword123',
        username: 'ageuser',
        profile: {
          age: 150 // Âge invalide
        }
      });
      await expect(user.save()).rejects.toThrow();
    });
  });
});