/**
 * @swagger
 * tags:
 *   name: GDPR
 *   description: Conformité GDPR - Gestion des données personnelles
 */

const express = require('express');
const router = express.Router();
const gdprController = require('./gdpr.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /api/gdpr/export:
 *   get:
 *     tags: [GDPR]
 *     summary: Exporter toutes les données personnelles (Art. 20 GDPR)
 *     description: Permet à l'utilisateur d'obtenir une copie complète de ses données personnelles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archive ZIP contenant toutes les données
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Nom du fichier d'export
 *             schema:
 *               type: string
 *               example: attachment; filename="ava-data-export-2025-01-15.zip"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/export', authMiddleware, gdprController.exportUserData);

/**
 * @swagger
 * /api/gdpr/delete:
 *   delete:
 *     tags: [GDPR]
 *     summary: Supprimer définitivement le compte (Droit à l'oubli - Art. 17 GDPR)
 *     description: Supprime définitivement toutes les données personnelles de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirmText
 *               - reason
 *             properties:
 *               confirmText:
 *                 type: string
 *                 enum: ["SUPPRIMER DÉFINITIVEMENT"]
 *                 description: Texte de confirmation obligatoire
 *               reason:
 *                 type: string
 *                 enum: ['data_portability', 'privacy_concerns', 'service_quality', 'other']
 *                 description: Raison de la suppression (optionnel pour analytics)
 *               keepAnonymizedStats:
 *                 type: boolean
 *                 default: false
 *                 description: Autoriser la conservation de statistiques anonymisées
 *     responses:
 *       200:
 *         description: Compte supprimé avec succès
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
 *                   example: "Votre compte et toutes vos données ont été définitivement supprimés"
 *                 deletionReport:
 *                   type: object
 *                   properties:
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                     recordsDeleted:
 *                       type: object
 *                       properties:
 *                         user: { type: integer }
 *                         health: { type: integer }
 *                         meals: { type: integer }
 *                         conversations: { type: integer }
 *                         garminData: { type: integer }
 *       400:
 *         description: Texte de confirmation incorrect
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/delete', authMiddleware, gdprController.deleteUserData);

/**
 * @swagger
 * /api/gdpr/consent:
 *   get:
 *     tags: [GDPR]
 *     summary: Obtenir l'état des consentements
 *     description: Récupère tous les consentements donnés par l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: État des consentements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 consents:
 *                   type: object
 *                   properties:
 *                     essential:
 *                       type: object
 *                       properties:
 *                         authentication:
 *                           type: boolean
 *                           example: true
 *                         dataProcessing:
 *                           type: boolean
 *                           example: true
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         usage:
 *                           type: boolean
 *                         performance:
 *                           type: boolean
 *                     marketing:
 *                       type: object
 *                       properties:
 *                         emails:
 *                           type: boolean
 *                         personalization:
 *                           type: boolean
 *                     thirdParty:
 *                       type: object
 *                       properties:
 *                         garmin:
 *                           type: boolean
 *                         spoonacular:
 *                           type: boolean
 */
router.get('/consent', authMiddleware, gdprController.getConsents);

/**
 * @swagger
 * /api/gdpr/consent:
 *   put:
 *     tags: [GDPR]
 *     summary: Mettre à jour les consentements
 *     description: Permet de modifier les consentements GDPR de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               consents:
 *                 type: object
 *                 properties:
 *                   analytics:
 *                     type: object
 *                     properties:
 *                       usage:
 *                         type: boolean
 *                       performance:
 *                         type: boolean
 *                   marketing:
 *                     type: object
 *                     properties:
 *                       emails:
 *                         type: boolean
 *                       personalization:
 *                         type: boolean
 *                   thirdParty:
 *                     type: object
 *                     properties:
 *                       garmin:
 *                         type: boolean
 *                       spoonacular:
 *                         type: boolean
 *     responses:
 *       200:
 *         description: Consentements mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedConsents:
 *                   type: object
 */
router.put('/consent', authMiddleware, gdprController.updateConsents);

/**
 * @swagger
 * /api/gdpr/data-processing:
 *   get:
 *     tags: [GDPR]
 *     summary: Obtenir le registre des traitements
 *     description: Information sur les traitements de données effectués (Art. 13-14 GDPR)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Registre des traitements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 processing:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       purpose:
 *                         type: string
 *                         example: "Suivi des métriques de santé"
 *                       legalBasis:
 *                         type: string
 *                         example: "Consentement (Art. 6.1.a GDPR)"
 *                       dataTypes:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Données de santé", "Habitudes alimentaires"]
 *                       retention:
 *                         type: string
 *                         example: "2 ans après résiliation du compte"
 *                       recipients:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Personnel médical autorisé", "Services d'analyse anonymisée"]
 */
router.get('/data-processing', authMiddleware, gdprController.getDataProcessing);

module.exports = router;