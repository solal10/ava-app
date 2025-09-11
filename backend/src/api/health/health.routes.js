/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Suivi des métriques de santé et bien-être
 */

const express = require('express');
const router = express.Router();
const healthController = require('./health.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /api/health/add/{userId}:
 *   post:
 *     tags: [Health]
 *     summary: Ajouter une entrée de santé pour un utilisateur spécifique
 *     description: Enregistre de nouvelles métriques de santé pour l'utilisateur spécifié
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
 *             properties:
 *               metrics:
 *                 $ref: '#/components/schemas/HealthMetrics'
 *     responses:
 *       201:
 *         description: Entrée de santé créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/add/:userId', authMiddleware, healthController.addHealthEntry);

/**
 * @swagger
 * /api/health/history/{userId}:
 *   get:
 *     tags: [Health]
 *     summary: Obtenir l'historique de santé d'un utilisateur
 *     description: Récupère toutes les entrées de santé pour l'utilisateur spécifié
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour filtrer l'historique
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour filtrer l'historique
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 30
 *         description: Nombre maximum d'entrées à retourner
 *     responses:
 *       200:
 *         description: Historique de santé récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HealthMetrics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/history/:userId', authMiddleware, healthController.getHealthHistory);

/**
 * @swagger
 * /api/health/latest/{userId}:
 *   get:
 *     tags: [Health]
 *     summary: Obtenir les dernières métriques de santé
 *     description: Récupère les données de santé les plus récentes pour l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Dernières métriques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HealthMetrics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Aucune donnée de santé trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/latest/:userId', authMiddleware, healthController.getLatestHealth);

/**
 * @swagger
 * /api/health/:
 *   get:
 *     tags: [Health]
 *     summary: Obtenir les données de santé pour le dashboard
 *     description: Récupère les métriques de santé de l'utilisateur connecté pour affichage dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['day', 'week', 'month', 'year']
 *           default: 'week'
 *         description: Période d'analyse des données
 *     responses:
 *       200:
 *         description: Données dashboard récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     current:
 *                       $ref: '#/components/schemas/HealthMetrics'
 *                     trends:
 *                       type: object
 *                       properties:
 *                         sleepTrend:
 *                           type: number
 *                           description: Évolution du sommeil (% de changement)
 *                         stressTrend:
 *                           type: number
 *                           description: Évolution du stress (% de changement)
 *                         energyTrend:
 *                           type: number
 *                           description: Évolution de l'énergie (% de changement)
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Recommandations personnalisées
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authMiddleware, healthController.getDashboardHealthData);

/**
 * @swagger
 * /api/health/add:
 *   post:
 *     tags: [Health]
 *     summary: Ajouter une entrée de santé pour l'utilisateur connecté
 *     description: Enregistre de nouvelles métriques de santé pour l'utilisateur actuellement authentifié
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metrics
 *             properties:
 *               metrics:
 *                 type: object
 *                 properties:
 *                   sommeil:
 *                     type: object
 *                     properties:
 *                       heures:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 24
 *                         example: 7.5
 *                       qualite:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 100
 *                         example: 85
 *                   stress:
 *                     type: object
 *                     properties:
 *                       niveau:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 100
 *                         example: 25
 *                       facteurs:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["travail", "sommeil"]
 *                   hydratation:
 *                     type: object
 *                     properties:
 *                       verresEau:
 *                         type: number
 *                         minimum: 0
 *                         example: 8
 *                       score:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 100
 *                         example: 90
 *                   energie:
 *                     type: object
 *                     properties:
 *                       niveau:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 100
 *                         example: 75
 *                       facteurs:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["exercice", "nutrition"]
 *                   activite:
 *                     type: object
 *                     properties:
 *                       duree:
 *                         type: number
 *                         minimum: 0
 *                         example: 45
 *                       type:
 *                         type: string
 *                         enum: ['cardio', 'musculation', 'yoga', 'marche', 'course', 'natation', 'velo', 'autre']
 *                         example: "cardio"
 *                       intensite:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 10
 *                         example: 7
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date de l'entrée (par défaut maintenant)
 *               source:
 *                 type: string
 *                 enum: ['manual', 'garmin', 'apple', 'fitbit', 'ai_prediction']
 *                 default: 'manual'
 *                 description: Source des données
 *     responses:
 *       201:
 *         description: Entrée de santé créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Données de santé enregistrées avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/HealthMetrics'
 *                 healthScore:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 100
 *                   description: Score de santé calculé
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/add', authMiddleware, healthController.addUserHealthEntry);

module.exports = router;
