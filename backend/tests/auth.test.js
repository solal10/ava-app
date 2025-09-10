const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Authentication Tests', () => {
  beforeAll(async () => {
    // Utiliser une base de données de test
    const testDB = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ava-app-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDB);
    }
  });

  afterAll(async () => {
    // Nettoyer et fermer la connexion
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    // Nettoyer les collections avant chaque test
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  });

  describe('POST /api/user/register', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        prenom: 'Test'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123!',
        prenom: 'Test'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Données invalides');
    });

    it('should reject weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        prenom: 'Test'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Données invalides');
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      // Créer un utilisateur test
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        prenom: 'Test'
      };

      await request(app)
        .post('/api/user/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Protected Routes', () => {
    let authToken;

    beforeEach(async () => {
      // Créer un utilisateur et obtenir un token
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        prenom: 'Test'
      };

      await request(app)
        .post('/api/user/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({ email: userData.email, password: userData.password });

      authToken = loginResponse.body.token;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email', 'test@example.com');
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});