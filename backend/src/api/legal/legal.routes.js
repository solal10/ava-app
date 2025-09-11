/**
 * @swagger
 * tags:
 *   name: Legal
 *   description: Documents légaux et conformité
 */

const express = require('express');
const router = express.Router();
const legalController = require('./legal.controller');

/**
 * @swagger
 * /api/legal/terms:
 *   get:
 *     tags: [Legal]
 *     summary: Récupérer les Conditions Générales d'Utilisation
 *     description: Retourne le contenu des CGU en format Markdown
 *     responses:
 *       200:
 *         description: CGU récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *                   description: Contenu des CGU en Markdown
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   description: Date de dernière mise à jour
 */
router.get('/terms', legalController.getTerms);

/**
 * @swagger
 * /api/legal/privacy:
 *   get:
 *     tags: [Legal]
 *     summary: Récupérer la Politique de Confidentialité
 *     description: Retourne le contenu de la politique de confidentialité en format Markdown
 *     responses:
 *       200:
 *         description: Politique de confidentialité récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *                   description: Contenu de la politique en Markdown
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   description: Date de dernière mise à jour
 */
router.get('/privacy', legalController.getPrivacy);

module.exports = router;