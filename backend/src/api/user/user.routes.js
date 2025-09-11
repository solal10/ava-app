/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs et authentification
 */

const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     tags: [Users]
 *     summary: Créer un nouveau compte utilisateur
 *     description: Inscription d'un nouvel utilisateur avec email et mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "motdepasse123"
 *               username:
 *                 type: string
 *                 example: "utilisateur123"
 *               profile:
 *                 $ref: '#/components/schemas/UserProfile'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
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
 *                   example: "Utilisateur créé avec succès"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email ou nom d'utilisateur déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', userController.register);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags: [Users]
 *     summary: Connexion utilisateur
 *     description: Authentifier un utilisateur avec email/username et mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Email ou nom d'utilisateur
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "motdepasse123"
 *     responses:
 *       200:
 *         description: Connexion réussie
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
 *                   example: "Connexion réussie"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /api/user/test-login:
 *   post:
 *     tags: [Users]
 *     summary: Connexion avec comptes de test
 *     description: Connexion rapide avec les comptes de démonstration pré-configurés
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountType
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: ['thomas', 'sarah']
 *                 example: "thomas"
 *                 description: "thomas (Pro) ou sarah (Elite)"
 *     responses:
 *       200:
 *         description: Connexion test réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
router.post('/test-login', userController.testLogin);

router.post('/', userController.createTestUser);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     tags: [Users]
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     description: Récupère les informations complètes du profil utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', authMiddleware, userController.getProfile);

/**
 * @swagger
 * /api/user/preferences:
 *   put:
 *     tags: [Users]
 *     summary: Mettre à jour les préférences utilisateur
 *     description: Met à jour les préférences de notifications et de coaching
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *     responses:
 *       200:
 *         description: Préférences mises à jour avec succès
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
 *                   example: "Préférences mises à jour"
 *                 preferences:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/preferences', authMiddleware, userController.updatePreferences);

/**
 * @swagger
 * /api/user/cookie-consents:
 *   put:
 *     tags: [Users]
 *     summary: Mettre à jour les consentements de cookies
 *     description: Gère les consentements aux cookies conformément CNIL/RGPD
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cookieConsents
 *             properties:
 *               cookieConsents:
 *                 type: object
 *                 properties:
 *                   essential:
 *                     type: boolean
 *                     default: true
 *                     description: Cookies essentiels (toujours activés)
 *                   functional:
 *                     type: boolean
 *                     description: Cookies de préférences utilisateur
 *                   analytics:
 *                     type: boolean
 *                     description: Cookies d'analyse d'usage anonymisée
 *                   marketing:
 *                     type: boolean
 *                     description: Cookies de personnalisation marketing
 *     responses:
 *       200:
 *         description: Consentements mis à jour avec succès
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
 *                   example: "Consentements cookies mis à jour"
 *                 cookieConsents:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/cookie-consents', authMiddleware, userController.updateCookieConsents);

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obtenir un utilisateur par ID
 *     description: Récupère les informations publiques d'un utilisateur spécifique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     tags: [Users]
 *     summary: Mettre à jour un utilisateur
 *     description: Met à jour les informations de l'utilisateur (propriétaire uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               profile:
 *                 $ref: '#/components/schemas/UserProfile'
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Accès refusé - vous ne pouvez modifier que votre propre profil
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', authMiddleware, userController.getUserById);
router.put('/:id', authMiddleware, userController.updateUser);

module.exports = router;
