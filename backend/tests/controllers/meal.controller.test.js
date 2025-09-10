const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mealController = require('../../src/api/meal/meal.controller');
const User = require('../../src/models/user.model');
const Meal = require('../../src/models/meal.model');

// Mock du service Spoonacular
jest.mock('../../src/services/spoonacular.service', () => ({
  analyzeFood: jest.fn().mockResolvedValue({
    category: 'Fruits',
    probability: 0.85,
    nutrition: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    recipes: []
  }),
  getNutritionInfo: jest.fn().mockResolvedValue({
    name: 'Pomme',
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10.4,
    sodium: 1
  }),
  searchRecipes: jest.fn().mockResolvedValue([
    {
      id: 1,
      title: 'Test Recipe',
      calories: 300,
      readyInMinutes: 30
    }
  ]),
  getMealPlanSuggestions: jest.fn().mockResolvedValue({
    totalCalories: 2000,
    meals: []
  })
}));

const app = express();
app.use(express.json());

// Mock middleware auth
const mockAuthMiddleware = (req, res, next) => {
  req.userId = 'test-user-id';
  next();
};

// Routes de test
app.post('/meal/:userId', mockAuthMiddleware, mealController.addMeal);
app.post('/meal/analyze-image', mockAuthMiddleware, mealController.analyzeFoodImage);
app.get('/meal/nutrition', mockAuthMiddleware, mealController.searchNutrition);
app.get('/meal/recipes', mockAuthMiddleware, mealController.searchRecipes);
app.get('/meal/meal-plan', mockAuthMiddleware, mealController.generateMealPlan);
app.post('/meal/:userId/analyze', mockAuthMiddleware, mealController.addMealWithAnalysis);
app.get('/meal/:userId', mockAuthMiddleware, mealController.getUserMeals);
app.delete('/meal/:id', mockAuthMiddleware, mealController.deleteMeal);

describe('Meal Controller', () => {
  let mongoServer;
  let testUser;
  let testMeal;

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
    await Meal.deleteMany({});
    
    testUser = new User({
      _id: 'test-user-id',
      email: 'test@example.com',
      password: 'hashedpassword'
    });
    await testUser.save();

    testMeal = {
      name: 'Test Meal',
      calories: 300,
      nutrients: {
        protein: 20,
        carbs: 30,
        fat: 10
      },
      mealType: 'dejeuner'
    };

    jest.clearAllMocks();
  });

  describe('POST /meal/:userId', () => {
    it('should add meal successfully', async () => {
      const response = await request(app)
        .post(`/meal/${testUser._id}`)
        .send(testMeal)
        .expect(201);

      expect(response.body.message).toContain('succès');
      expect(response.body.meal).toBeDefined();
      expect(response.body.meal.name).toBe(testMeal.name);
      expect(response.body.meal.calories).toBe(testMeal.calories);
    });

    it('should fail to add meal for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/meal/${nonExistentId}`)
        .send(testMeal)
        .expect(404);

      expect(response.body.message).toContain('non trouvé');
    });
  });

  describe('POST /meal/analyze-image', () => {
    it('should analyze food image successfully', async () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2wBD...';
      
      const response = await request(app)
        .post('/meal/analyze-image')
        .send({ imageData })
        .expect(200);

      expect(response.body.message).toContain('succès');
      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.category).toBe('Fruits');
      expect(response.body.analysis.probability).toBe(0.85);
    });

    it('should fail without image data', async () => {
      const response = await request(app)
        .post('/meal/analyze-image')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Image requise');
    });
  });

  describe('GET /meal/nutrition', () => {
    it('should search nutrition info successfully', async () => {
      const response = await request(app)
        .get('/meal/nutrition')
        .query({ foodName: 'pomme' })
        .expect(200);

      expect(response.body.message).toContain('récupérées');
      expect(response.body.nutrition).toBeDefined();
      expect(response.body.nutrition.name).toBe('Pomme');
      expect(response.body.nutrition.calories).toBe(52);
    });

    it('should fail without food name', async () => {
      const response = await request(app)
        .get('/meal/nutrition')
        .expect(400);

      expect(response.body.message).toContain('requis');
    });
  });

  describe('GET /meal/recipes', () => {
    it('should search recipes successfully', async () => {
      const response = await request(app)
        .get('/meal/recipes')
        .query({ query: 'chicken' })
        .expect(200);

      expect(response.body.message).toContain('trouvées');
      expect(response.body.recipes).toBeDefined();
      expect(Array.isArray(response.body.recipes)).toBe(true);
    });

    it('should fail without search query', async () => {
      const response = await request(app)
        .get('/meal/recipes')
        .expect(400);

      expect(response.body.message).toContain('requis');
    });
  });

  describe('GET /meal/meal-plan', () => {
    it('should generate meal plan successfully', async () => {
      const response = await request(app)
        .get('/meal/meal-plan')
        .query({ targetCalories: 2000 })
        .expect(200);

      expect(response.body.message).toContain('généré');
      expect(response.body.mealPlan).toBeDefined();
      expect(response.body.mealPlan.totalCalories).toBe(2000);
    });

    it('should use default calories if not specified', async () => {
      const response = await request(app)
        .get('/meal/meal-plan')
        .expect(200);

      expect(response.body.targetCalories).toBe(2000);
    });
  });

  describe('POST /meal/:userId/analyze', () => {
    it('should add meal with analysis successfully', async () => {
      const mealData = {
        mealName: 'Pomme',
        mealType: 'collation'
      };

      const response = await request(app)
        .post(`/meal/${testUser._id}/analyze`)
        .send(mealData)
        .expect(201);

      expect(response.body.message).toContain('analyse');
      expect(response.body.meal).toBeDefined();
      expect(response.body.nutritionInfo).toBeDefined();
    });

    it('should add meal with image analysis', async () => {
      const mealData = {
        imageData: 'data:image/jpeg;base64,test-image-data',
        mealType: 'dejeuner'
      };

      const response = await request(app)
        .post(`/meal/${testUser._id}/analyze`)
        .send(mealData)
        .expect(201);

      expect(response.body.meal.name).toBe('Fruits'); // De notre mock
      expect(response.body.analysis).toBeDefined();
    });
  });

  describe('GET /meal/:userId', () => {
    beforeEach(async () => {
      // Créer quelques repas de test
      const meal1 = new Meal({
        userId: testUser._id,
        name: 'Meal 1',
        calories: 300
      });
      const meal2 = new Meal({
        userId: testUser._id,
        name: 'Meal 2',
        calories: 400
      });
      await meal1.save();
      await meal2.save();
    });

    it('should get user meals successfully', async () => {
      const response = await request(app)
        .get(`/meal/${testUser._id}`)
        .expect(200);

      expect(response.body.meals).toBeDefined();
      expect(Array.isArray(response.body.meals)).toBe(true);
      expect(response.body.meals.length).toBe(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/meal/${testUser._id}`)
        .query({ limit: 1, skip: 0 })
        .expect(200);

      expect(response.body.meals.length).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.skip).toBe(0);
    });
  });

  describe('DELETE /meal/:id', () => {
    let mealId;

    beforeEach(async () => {
      const meal = new Meal({
        userId: testUser._id,
        name: 'Test Meal',
        calories: 300
      });
      await meal.save();
      mealId = meal._id;
    });

    it('should delete meal successfully', async () => {
      const response = await request(app)
        .delete(`/meal/${mealId}`)
        .expect(200);

      expect(response.body.message).toContain('succès');

      // Vérifier que le repas a été supprimé
      const deletedMeal = await Meal.findById(mealId);
      expect(deletedMeal).toBeNull();
    });

    it('should fail to delete non-existent meal', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/meal/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toContain('non trouvé');
    });
  });
});