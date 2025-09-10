const express = require('express');
const router = express.Router();
const mealController = require('./meal.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validateMealData, validatePagination, handleValidationErrors } = require('../../middlewares/validation.middleware');
const { apiLimiter } = require('../../middlewares/security.middleware');

// Routes de reconnaissance alimentaire avancée (TensorFlow.js + Spoonacular)
router.post('/analyze-image', authMiddleware, apiLimiter, mealController.analyzeFoodImage);
router.post('/recognize-advanced', authMiddleware, apiLimiter, mealController.advancedFoodRecognition);
router.post('/recognize-batch', authMiddleware, apiLimiter, mealController.batchFoodRecognition);
router.get('/model-info', authMiddleware, mealController.getModelInfo);

// Routes Spoonacular (avec rate limiting API)
router.get('/nutrition', authMiddleware, apiLimiter, mealController.searchNutrition);
router.get('/recipes', authMiddleware, apiLimiter, mealController.searchRecipes);
router.get('/meal-plan', authMiddleware, apiLimiter, mealController.generateMealPlan);

// Routes de gestion des repas
router.post('/:userId', authMiddleware, validateMealData, handleValidationErrors, mealController.addMeal);
router.post('/:userId/analyze', authMiddleware, mealController.addMealWithAnalysis);
router.get('/:userId', authMiddleware, validatePagination, handleValidationErrors, mealController.getUserMeals);
router.get('/:userId/recent', authMiddleware, mealController.getRecentMeals);
router.delete('/:id', authMiddleware, mealController.deleteMeal);

module.exports = router;
