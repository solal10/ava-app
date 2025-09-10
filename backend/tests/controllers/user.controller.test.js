const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const userController = require('../../src/api/user/user.controller');
const User = require('../../src/models/user.model');

const app = express();
app.use(express.json());

// Routes de test
app.post('/register', userController.register);
app.post('/login', userController.login);
app.get('/profile/:id', userController.getUserById);

describe('User Controller', () => {
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
    testUser = {
      email: 'test@example.com',
      password: 'Password123!',
      prenom: 'Test'
    };
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.prenom).toBe(testUser.prenom);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail to register user with existing email', async () => {
      // Créer un utilisateur existant
      await request(app)
        .post('/register')
        .send(testUser);

      // Tenter de créer un autre utilisateur avec le même email
      const response = await request(app)
        .post('/register')
        .send(testUser)
        .expect(400);

      expect(response.body.message).toContain('existe déjà');
    });

    it('should fail to register user with invalid email', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should fail to register user with weak password', async () => {
      const weakPasswordUser = { ...testUser, password: '123' };
      
      const response = await request(app)
        .post('/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      await request(app)
        .post('/register')
        .send(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail login with invalid email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'wrong@example.com',
          password: testUser.password
        })
        .expect(400);

      expect(response.body.message).toContain('invalides');
    });

    it('should fail login with invalid password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.message).toContain('invalides');
    });

    it('should fail login with missing fields', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: testUser.email
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /profile/:id', () => {
    let userId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/register')
        .send(testUser);
      userId = response.body.user.id;
    });

    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get(`/profile/${userId}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.prenom).toBe(testUser.prenom);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail to get profile with invalid ID', async () => {
      const response = await request(app)
        .get('/profile/invalid-id')
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should fail to get profile for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/profile/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toContain('non trouvé');
    });
  });
});