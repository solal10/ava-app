/**
 * @swagger
 * tags:
 *   name: Meals
 *   description: Gestion des repas et reconnaissance alimentaire
 */

const express = require('express');
const router = express.Router();
const mealController = require('./meal.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validateMealData, validatePagination, handleValidationErrors } = require('../../middlewares/validation.middleware');
const { apiLimiter } = require('../../middlewares/security.middleware');

/**
 * @swagger
 * /api/meal/analyze-image:
 *   post:
 *     tags: [Meals]
 *     summary: Analyser une image de nourriture
 *     description: Utilise TensorFlow.js pour identifier les aliments dans une image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: byte
 *                 description: Image encodée en base64
 *               mealType:
 *                 type: string
 *                 enum: ['petit_dejeuner', 'dejeuner', 'diner', 'collation']
 *                 description: Type de repas
 *     responses:
 *       200:
 *         description: Analyse d'image réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 predictions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       food:
 *                         type: string
 *                         description: Nom de l'aliment identifié
 *                       confidence:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 1
 *                         description: Confiance de la prédiction
 *                       nutrition:
 *                         type: object
 *                         properties:
 *                           calories:
 *                             type: number
 *                           protein:
 *                             type: number
 *                           carbs:
 *                             type: number
 *                           fat:
 *                             type: number
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/analyze-image', authMiddleware, apiLimiter, mealController.analyzeFoodImage);
/**
 * @swagger
 * /api/meal/recognize-advanced:
 *   post:
 *     tags: [Meals]
 *     summary: Reconnaissance alimentaire avancée
 *     description: Analyse avancée combinant TensorFlow.js et API Spoonacular
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: byte
 *               includeNutrition:
 *                 type: boolean
 *                 default: true
 *               includeRecipes:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Reconnaissance avancée réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     foodItems:
 *                       type: array
 *                       items:
 *                         type: string
 *                     nutritionData:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/recognize-advanced', authMiddleware, apiLimiter, mealController.advancedFoodRecognition);
/**
 * @swagger
 * /api/meal/recognize-enhanced:
 *   post:
 *     tags: [Meals]
 *     summary: Reconnaissance alimentaire améliorée
 *     description: Version améliorée avec analyse nutritionnelle détaillée
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: byte
 *               userProfile:
 *                 type: object
 *                 description: Profil utilisateur pour personnalisation
 *     responses:
 *       200:
 *         description: Reconnaissance améliorée réussie
 *       403:
 *         description: Abonnement Pro ou Elite requis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/recognize-enhanced', authMiddleware, apiLimiter, mealController.enhancedFoodRecognition);
/**
 * @swagger
 * /api/meal/recognize-batch:
 *   post:
 *     tags: [Meals]
 *     summary: Reconnaissance en lot d'images
 *     description: Analyse multiple d'images de nourriture (Elite uniquement)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: byte
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Analyse en lot réussie
 *       403:
 *         description: Abonnement Elite requis
 */
router.post('/recognize-batch', authMiddleware, apiLimiter, mealController.batchFoodRecognition);
/**
 * @swagger
 * /api/meal/model-info:
 *   get:
 *     tags: [Meals]
 *     summary: Informations sur le modèle IA
 *     description: Retourne les informations sur le modèle TensorFlow.js utilisé
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations du modèle récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 modelInfo:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                     isLoaded:
 *                       type: boolean
 *                     supportedFormats:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/model-info', authMiddleware, mealController.getModelInfo);
/**
 * @swagger
 * /api/meal/download-model:
 *   post:
 *     tags: [Meals]
 *     summary: Télécharger un modèle pré-entraîné
 *     description: Met à jour le modèle de reconnaissance alimentaire (Admin seulement)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Modèle téléchargé avec succès
 *       403:
 *         description: Accès administrateur requis
 */
router.post('/download-model', authMiddleware, mealController.downloadPretrainedModel);

/**
 * @swagger
 * /api/meal/nutrition:
 *   get:
 *     tags: [Meals]
 *     summary: Rechercher des informations nutritionnelles
 *     description: Recherche dans la base de données Spoonacular
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom de l'aliment à rechercher
 *       - in: query
 *         name: number
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Nombre de résultats
 *     responses:
 *       200:
 *         description: Informations nutritionnelles trouvées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       calories:
 *                         type: number
 *                       nutrients:
 *                         type: object
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/nutrition', authMiddleware, apiLimiter, mealController.searchNutrition);
/**
 * @swagger
 * /api/meal/recipes:
 *   get:
 *     tags: [Meals]
 *     summary: Rechercher des recettes
 *     description: Recherche de recettes personnalisées via Spoonacular
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Ingrédients ou nom de recette
 *       - in: query
 *         name: diet
 *         schema:
 *           type: string
 *           enum: ['vegetarian', 'vegan', 'ketogenic', 'paleo']
 *         description: Type de régime alimentaire
 *       - in: query
 *         name: intolerances
 *         schema:
 *           type: string
 *         description: Intolérances alimentaires (séparées par virgule)
 *     responses:
 *       200:
 *         description: Recettes trouvées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recipes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       image:
 *                         type: string
 *                       readyInMinutes:
 *                         type: integer
 *                       nutrition:
 *                         type: object
 */
router.get('/recipes', authMiddleware, apiLimiter, mealController.searchRecipes);
/**
 * @swagger
 * /api/meal/meal-plan:
 *   get:
 *     tags: [Meals]
 *     summary: Générer un plan de repas
 *     description: Crée un plan de repas personnalisé (Pro/Elite uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeFrame
 *         schema:
 *           type: string
 *           enum: ['day', 'week']
 *           default: 'day'
 *         description: Durée du plan
 *       - in: query
 *         name: targetCalories
 *         schema:
 *           type: integer
 *           minimum: 1000
 *           maximum: 4000
 *         description: Objectif calorique quotidien
 *       - in: query
 *         name: diet
 *         schema:
 *           type: string
 *           enum: ['vegetarian', 'vegan', 'ketogenic', 'paleo', 'mediterranean']
 *         description: Type de régime
 *     responses:
 *       200:
 *         description: Plan de repas généré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 mealPlan:
 *                   type: object
 *                   properties:
 *                     meals:
 *                       type: array
 *                       items:
 *                         type: object
 *                     nutrients:
 *                       type: object
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/meal-plan', authMiddleware, apiLimiter, mealController.generateMealPlan);

/**
 * @swagger
 * /api/meal/{userId}:
 *   post:
 *     tags: [Meals]
 *     summary: Ajouter un repas pour un utilisateur
 *     description: Enregistre un nouveau repas avec ses informations nutritionnelles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mealType
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom du repas
 *               description:
 *                 type: string
 *                 description: Description du repas
 *               mealType:
 *                 type: string
 *                 enum: ['petit_dejeuner', 'dejeuner', 'diner', 'collation']
 *               calories:
 *                 type: number
 *                 minimum: 0
 *               nutrients:
 *                 type: object
 *                 properties:
 *                   proteines:
 *                     type: number
 *                   lipides:
 *                     type: number
 *                   glucides:
 *                     type: number
 *                   fibres:
 *                     type: number
 *               imageUrl:
 *                 type: string
 *                 description: URL de l'image du repas
 *     responses:
 *       201:
 *         description: Repas ajouté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 meal:
 *                   $ref: '#/components/schemas/Meal'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:userId', authMiddleware, validateMealData, handleValidationErrors, mealController.addMeal);
/**
 * @swagger
 * /api/meal/{userId}/analyze:
 *   post:
 *     tags: [Meals]
 *     summary: Ajouter un repas avec analyse IA
 *     description: Ajoute un repas et l'analyse avec l'IA pour des recommandations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - mealType
 *             properties:
 *               image:
 *                 type: string
 *                 format: byte
 *               mealType:
 *                 type: string
 *                 enum: ['petit_dejeuner', 'dejeuner', 'diner', 'collation']
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Repas ajouté et analysé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 meal:
 *                   $ref: '#/components/schemas/Meal'
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     healthScore:
 *                       type: number
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.post('/:userId/analyze', authMiddleware, mealController.addMealWithAnalysis);
/**
 * @swagger
 * /api/meal/{userId}:
 *   get:
 *     tags: [Meals]
 *     summary: Obtenir les repas d'un utilisateur
 *     description: Récupère la liste des repas pour un utilisateur avec pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: mealType
 *         schema:
 *           type: string
 *           enum: ['petit_dejeuner', 'dejeuner', 'diner', 'collation']
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Liste des repas récupérée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 meals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meal'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/:userId', authMiddleware, validatePagination, handleValidationErrors, mealController.getUserMeals);
/**
 * @swagger
 * /api/meal/{userId}/recent:
 *   get:
 *     tags: [Meals]
 *     summary: Obtenir les repas récents
 *     description: Récupère les derniers repas de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 7
 *         description: Nombre de jours à récupérer
 *     responses:
 *       200:
 *         description: Repas récents récupérés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 meals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meal'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalCalories:
 *                       type: number
 *                     avgHealthScore:
 *                       type: number
 *                     mealCount:
 *                       type: integer
 */
router.get('/:userId/recent', authMiddleware, mealController.getRecentMeals);
/**
 * @swagger
 * /api/meal/{id}:
 *   delete:
 *     tags: [Meals]
 *     summary: Supprimer un repas
 *     description: Supprime un repas spécifique (propriétaire seulement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du repas à supprimer
 *     responses:
 *       200:
 *         description: Repas supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Repas supprimé avec succès"
 *       403:
 *         description: Accès refusé - vous ne pouvez supprimer que vos propres repas
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', authMiddleware, mealController.deleteMeal);

/**
 * @swagger
 * /api/meal/nutrition-plans:
 *   post:
 *     tags: [Meals]
 *     summary: Créer un plan nutritionnel
 *     description: Génère un plan nutritionnel personnalisé (Pro/Elite uniquement)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - goal
 *               - duration
 *             properties:
 *               goal:
 *                 type: string
 *                 enum: ['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain']
 *               duration:
 *                 type: integer
 *                 minimum: 7
 *                 maximum: 90
 *                 description: Durée en jours
 *               targetCalories:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 4000
 *               dietaryPreferences:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['vegetarian', 'vegan', 'ketogenic', 'paleo', 'mediterranean']
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Plan nutritionnel créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 plan:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     dailyMeals:
 *                       type: array
 *                       items:
 *                         type: object
 *                     nutritionalTargets:
 *                       type: object
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/nutrition-plans', authMiddleware, mealController.createNutritionPlan);
/**
 * @swagger
 * /api/meal/nutrition-plans:
 *   get:
 *     tags: [Meals]
 *     summary: Obtenir les plans nutritionnels
 *     description: Récupère les plans nutritionnels de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrer par plans actifs seulement
 *       - in: query
 *         name: goal
 *         schema:
 *           type: string
 *           enum: ['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain']
 *         description: Filtrer par objectif
 *     responses:
 *       200:
 *         description: Plans nutritionnels récupérés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       goal:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/nutrition-plans', authMiddleware, mealController.getNutritionPlans);

/**
 * @swagger
 * /api/meal/workout-plans:
 *   post:
 *     tags: [Meals]
 *     summary: Créer un plan d'entraînement
 *     description: Génère un plan d'entraînement personnalisé (Pro/Elite uniquement)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - goal
 *               - level
 *               - frequency
 *             properties:
 *               goal:
 *                 type: string
 *                 enum: ['strength', 'endurance', 'flexibility', 'weight_loss']
 *               level:
 *                 type: string
 *                 enum: ['beginner', 'intermediate', 'advanced']
 *               frequency:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7
 *                 description: Nombre de séances par semaine
 *               duration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 120
 *                 description: Durée par séance en minutes
 *               equipment:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['none', 'dumbbells', 'resistance_bands', 'gym_access']
 *     responses:
 *       201:
 *         description: Plan d'entraînement créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 plan:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     workouts:
 *                       type: array
 *                       items:
 *                         type: object
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/workout-plans', authMiddleware, mealController.createWorkoutPlan);
/**
 * @swagger
 * /api/meal/workout-plans:
 *   get:
 *     tags: [Meals]
 *     summary: Obtenir les plans d'entraînement
 *     description: Récupère les plans d'entraînement de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrer par plans actifs seulement
 *       - in: query
 *         name: goal
 *         schema:
 *           type: string
 *           enum: ['strength', 'endurance', 'flexibility', 'weight_loss']
 *     responses:
 *       200:
 *         description: Plans d'entraînement récupérés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       goal:
 *                         type: string
 *                       level:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 */
router.get('/workout-plans', authMiddleware, mealController.getWorkoutPlans);

module.exports = router;
