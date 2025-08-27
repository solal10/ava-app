const express = require('express');
const router = express.Router();
const mealController = require('./meal.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Routes protégées
router.post('/:userId', authMiddleware, mealController.addMeal);
router.get('/:userId', authMiddleware, mealController.getUserMeals);
router.get('/:userId/recent', authMiddleware, mealController.getRecentMeals);
router.delete('/:id', authMiddleware, mealController.deleteMeal);

module.exports = router;
