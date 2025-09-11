/**
 * @swagger
 * tags:
 *   name: AI Coach
 *   description: Intelligence artificielle et coaching personnalisé
 */

const express = require('express');
const router = express.Router();
const iaController = require('./ia.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /api/ia/ask:
 *   post:
 *     tags: [AI Coach]
 *     summary: Poser une question au coach IA
 *     description: Obtient une réponse personnalisée du coach IA basée sur le profil utilisateur
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Question ou message pour le coach IA
 *                 example: "Comment puis-je améliorer mon sommeil ?"
 *               context:
 *                 type: object
 *                 description: Contexte additionnel (métriques récentes, etc.)
 *               conversationId:
 *                 type: string
 *                 description: ID de la conversation pour continuité
 *     responses:
 *       200:
 *         description: Réponse du coach IA générée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 response:
 *                   type: string
 *                   description: Réponse du coach IA
 *                 conversationId:
 *                   type: string
 *                   description: ID de la conversation
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Suggestions de questions de suivi
 *                 usage:
 *                   type: object
 *                   properties:
 *                     remaining:
 *                       type: integer
 *                       description: Requêtes restantes ce mois
 *                     limit:
 *                       type: integer
 *                       description: Limite mensuelle
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Limite de requêtes IA atteinte
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/ask', authMiddleware, iaController.askCoach);

/**
 * @swagger
 * /api/ia/history:
 *   get:
 *     tags: [AI Coach]
 *     summary: Obtenir l'historique des conversations
 *     description: Récupère l'historique des conversations avec le coach IA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Nombre de conversations à retourner
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Décalage pour la pagination
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: string
 *         description: ID d'une conversation spécifique
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       messages:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             role:
 *                               type: string
 *                               enum: ['user', 'assistant']
 *                             content:
 *                               type: string
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */
router.get('/history', authMiddleware, iaController.getConversationHistory);

/**
 * @swagger
 * /api/ia/analytics:
 *   get:
 *     tags: [AI Coach]
 *     summary: Obtenir les analytics des conversations
 *     description: Statistiques d'utilisation du coach IA (Pro/Elite uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['week', 'month', 'year']
 *           default: 'month'
 *         description: Période d'analyse
 *     responses:
 *       200:
 *         description: Analytics récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     totalConversations:
 *                       type: integer
 *                     totalMessages:
 *                       type: integer
 *                     averageResponseTime:
 *                       type: number
 *                       description: Temps de réponse moyen en ms
 *                     topTopics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           topic:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     satisfactionScore:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 5
 *                       description: Score de satisfaction moyen
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/analytics', authMiddleware, iaController.getConversationAnalytics);

/**
 * @swagger
 * /api/ia/feedback:
 *   post:
 *     tags: [AI Coach]
 *     summary: Fournir un feedback sur une réponse IA
 *     description: Permet d'évaluer la qualité des réponses du coach IA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - messageId
 *               - rating
 *             properties:
 *               conversationId:
 *                 type: string
 *                 description: ID de la conversation
 *               messageId:
 *                 type: string
 *                 description: ID du message évalué
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Note de 1 à 5
 *               comment:
 *                 type: string
 *                 description: Commentaire optionnel
 *               category:
 *                 type: string
 *                 enum: ['accuracy', 'helpfulness', 'clarity', 'relevance']
 *                 description: Catégorie du feedback
 *     responses:
 *       200:
 *         description: Feedback enregistré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Merci pour votre feedback !"
 */
router.post('/feedback', authMiddleware, iaController.provideFeedback);

/**
 * @swagger
 * /api/ia/history:
 *   delete:
 *     tags: [AI Coach]
 *     summary: Effacer l'historique des conversations
 *     description: Supprime toutes les conversations de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: string
 *         description: ID d'une conversation spécifique à supprimer (optionnel)
 *     responses:
 *       200:
 *         description: Historique effacé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Historique effacé avec succès"
 *                 deletedCount:
 *                   type: integer
 *                   description: Nombre de conversations supprimées
 */
router.delete('/history', authMiddleware, iaController.clearConversationHistory);

/**
 * @swagger
 * /api/ia/usage-limits:
 *   get:
 *     tags: [AI Coach]
 *     summary: Obtenir les limites d'usage IA
 *     description: Récupère les limites d'utilisation basées sur l'abonnement
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Limites d'usage récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 limits:
 *                   type: object
 *                   properties:
 *                     monthly:
 *                       type: integer
 *                       description: Limite mensuelle de requêtes
 *                     daily:
 *                       type: integer
 *                       description: Limite quotidienne de requêtes
 *                     used:
 *                       type: object
 *                       properties:
 *                         today:
 *                           type: integer
 *                         thisMonth:
 *                           type: integer
 *                     features:
 *                       type: object
 *                       properties:
 *                         advancedAnalysis:
 *                           type: boolean
 *                         personalizedCoaching:
 *                           type: boolean
 *                         conversationHistory:
 *                           type: boolean
 *                 subscriptionLevel:
 *                   type: string
 *                   enum: ['explore', 'perform', 'pro', 'elite']
 */
router.get('/usage-limits', authMiddleware, iaController.getUsageLimits);

/**
 * @swagger
 * /api/ia/status:
 *   get:
 *     tags: [AI Coach]
 *     summary: Obtenir le statut du service IA
 *     description: Vérifie la disponibilité des services IA
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut du service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 services:
 *                   type: object
 *                   properties:
 *                     openai:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: ['operational', 'degraded', 'unavailable']
 *                         responseTime:
 *                           type: number
 *                           description: Temps de réponse en ms
 *                     anthropic:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                 lastChecked:
 *                   type: string
 *                   format: date-time
 */
router.get('/status', authMiddleware, iaController.getServiceStatus);

/**
 * @swagger
 * /api/ia/test-api:
 *   post:
 *     tags: [AI Coach]
 *     summary: Tester les connexions API IA
 *     description: Teste la connectivité avec les services IA externes (Admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: ['openai', 'anthropic', 'all']
 *                 default: 'all'
 *               testMessage:
 *                 type: string
 *                 default: "Test de connectivité"
 *     responses:
 *       200:
 *         description: Tests de connectivité effectués
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 tests:
 *                   type: object
 *                   properties:
 *                     openai:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         responseTime:
 *                           type: number
 *                         error:
 *                           type: string
 *                     anthropic:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         responseTime:
 *                           type: number
 *                         error:
 *                           type: string
 *       403:
 *         description: Accès administrateur requis
 */
router.post('/test-api', authMiddleware, iaController.testAPIConnections);

module.exports = router;
