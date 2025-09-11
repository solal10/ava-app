const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middlewares/auth.middleware');
const backupService = require('../../services/backup.service');
const loggerService = require('../../services/logger.service');

/**
 * Routes pour la gestion des backups MongoDB
 * Réservées aux administrateurs uniquement
 */

/**
 * GET /api/backup/status
 * Statut du service de backup
 */
router.get('/status', authMiddleware, (req, res) => {
  try {
    const status = backupService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    loggerService.error('Erreur récupération statut backup', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur récupération statut backup'
    });
  }
});

/**
 * GET /api/backup/history
 * Historique des backups
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await backupService.getBackupHistory(limit);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    loggerService.error('Erreur récupération historique backup', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur récupération historique backup'
    });
  }
});

/**
 * POST /api/backup/create
 * Créer un backup manuel
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { type = 'manual', description } = req.body;
    
    loggerService.info('Backup manuel demandé', {
      type,
      description,
      requestedBy: req.user?._id?.toString()
    });

    const result = await backupService.createBackup(type, description);
    
    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    loggerService.error('Erreur création backup manuel', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur création backup'
    });
  }
});

/**
 * POST /api/backup/restore
 * Restaurer depuis un backup
 */
router.post('/restore', authMiddleware, async (req, res) => {
  try {
    const { backupFile, targetDatabase } = req.body;

    if (!backupFile) {
      return res.status(400).json({
        success: false,
        error: 'Fichier de backup requis'
      });
    }

    loggerService.info('Restauration backup demandée', {
      backupFile,
      targetDatabase,
      requestedBy: req.user?._id?.toString()
    });

    const result = await backupService.restoreBackup(backupFile, targetDatabase);
    
    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    loggerService.error('Erreur restauration backup', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur restauration backup'
    });
  }
});

/**
 * DELETE /api/backup/:backupId
 * Supprimer un backup spécifique
 */
router.delete('/:backupId', authMiddleware, async (req, res) => {
  try {
    const { backupId } = req.params;

    loggerService.info('Suppression backup demandée', {
      backupId,
      requestedBy: req.user?._id?.toString()
    });

    const result = await backupService.deleteBackup(backupId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup supprimé avec succès'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Backup non trouvé'
      });
    }
  } catch (error) {
    loggerService.error('Erreur suppression backup', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur suppression backup'
    });
  }
});

/**
 * POST /api/backup/cleanup
 * Nettoyer les anciens backups selon les règles de rétention
 */
router.post('/cleanup', authMiddleware, async (req, res) => {
  try {
    const { force = false } = req.body;

    loggerService.info('Nettoyage backup demandé', {
      force,
      requestedBy: req.user?._id?.toString()
    });

    const result = await backupService.cleanup(force);
    
    res.json({
      success: true,
      data: {
        deletedBackups: result.deleted,
        retainedBackups: result.retained,
        freedSpace: result.freedSpace
      }
    });
  } catch (error) {
    loggerService.error('Erreur nettoyage backup', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur nettoyage backup'
    });
  }
});

/**
 * PUT /api/backup/config
 * Mettre à jour la configuration du backup
 */
router.put('/config', authMiddleware, async (req, res) => {
  try {
    const { schedule, retention, storage, compression, encryption } = req.body;

    loggerService.info('Mise à jour config backup', {
      updatedBy: req.user?._id?.toString(),
      changes: Object.keys(req.body)
    });

    const result = await backupService.updateConfig({
      schedule,
      retention,
      storage,
      compression,
      encryption
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Configuration mise à jour',
        data: result.config
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    loggerService.error('Erreur mise à jour config backup', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur mise à jour configuration'
    });
  }
});

/**
 * POST /api/backup/test
 * Tester la configuration backup
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const { testType = 'connection' } = req.body;

    loggerService.info('Test backup demandé', {
      testType,
      requestedBy: req.user?._id?.toString()
    });

    const result = await backupService.testConfiguration(testType);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Erreur test backup', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur test configuration'
    });
  }
});

/**
 * GET /api/backup/download/:backupId
 * Télécharger un fichier de backup
 */
router.get('/download/:backupId', authMiddleware, async (req, res) => {
  try {
    const { backupId } = req.params;

    loggerService.info('Téléchargement backup demandé', {
      backupId,
      requestedBy: req.user?._id?.toString()
    });

    const result = await backupService.downloadBackup(backupId);
    
    if (result.success && result.filePath) {
      res.download(result.filePath, result.filename || `backup-${backupId}.tar.gz`);
    } else {
      res.status(404).json({
        success: false,
        error: 'Backup non trouvé ou non disponible'
      });
    }
  } catch (error) {
    loggerService.error('Erreur téléchargement backup', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur téléchargement backup'
    });
  }
});

module.exports = router;