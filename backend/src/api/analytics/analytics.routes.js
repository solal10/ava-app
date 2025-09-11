const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { getAnalytics } = require('../../middlewares/analytics.middleware');
const analyticsService = require('../../services/analytics.service');
const loggerService = require('../../services/logger.service');

/**
 * Routes pour les analytics et monitoring
 * Réservées aux administrateurs
 */

/**
 * GET /api/analytics/dashboard
 * Tableau de bord des analytics en temps réel
 */
router.get('/dashboard', authMiddleware, getAnalytics);

/**
 * GET /api/analytics/current
 * Statistiques actuelles (jour en cours)
 */
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const stats = analyticsService.getCurrentStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    loggerService.error('Erreur récupération stats actuelles', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur récupération statistiques'
    });
  }
});

/**
 * GET /api/analytics/historical
 * Données historiques sur X jours
 */
router.get('/historical', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await analyticsService.getHistoricalData(days);
    
    res.json({
      success: true,
      data,
      period: `${days} jours`
    });
  } catch (error) {
    loggerService.error('Erreur récupération données historiques', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur récupération données historiques'
    });
  }
});

/**
 * GET /api/analytics/report
 * Rapport complet avec insights
 */
router.get('/report', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const report = await analyticsService.generateReport(days);
    
    if (!report) {
      return res.status(500).json({
        success: false,
        error: 'Impossible de générer le rapport'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    loggerService.error('Erreur génération rapport', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur génération rapport'
    });
  }
});

/**
 * GET /api/analytics/logs/stats
 * Statistiques des logs
 */
router.get('/logs/stats', authMiddleware, (req, res) => {
  try {
    const stats = loggerService.getLogStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    loggerService.error('Erreur récupération stats logs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur récupération statistiques logs'
    });
  }
});

/**
 * POST /api/analytics/cleanup
 * Nettoyer les anciennes données
 */
router.post('/cleanup', authMiddleware, async (req, res) => {
  try {
    const { days = 90, type = 'both' } = req.body;
    
    let analyticsCleanup = 0;
    let logsCleanup = 0;

    if (type === 'analytics' || type === 'both') {
      analyticsCleanup = await analyticsService.cleanup(days);
    }

    if (type === 'logs' || type === 'both') {
      logsCleanup = loggerService.cleanupLogs(days);
    }

    loggerService.info('Nettoyage manuel effectué', {
      type,
      days,
      analyticsRecords: analyticsCleanup,
      logFiles: logsCleanup,
      requestedBy: req.user?._id?.toString()
    });

    res.json({
      success: true,
      data: {
        analyticsRecordsDeleted: analyticsCleanup,
        logFilesDeleted: logsCleanup,
        olderThanDays: days
      }
    });
  } catch (error) {
    loggerService.error('Erreur nettoyage données', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage'
    });
  }
});

/**
 * POST /api/analytics/track/business
 * Tracker manuellement une métrique business
 */
router.post('/track/business', authMiddleware, async (req, res) => {
  try {
    const { metric, value, metadata = {} } = req.body;

    if (!metric || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Métrique et valeur requis'
      });
    }

    await analyticsService.trackBusinessMetric(metric, value, {
      ...metadata,
      manuallyTracked: true,
      trackedBy: req.user?._id?.toString()
    });

    res.json({
      success: true,
      message: 'Métrique trackée avec succès'
    });
  } catch (error) {
    loggerService.error('Erreur tracking métrique manuelle', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur tracking métrique'
    });
  }
});

/**
 * GET /api/analytics/health
 * Statut de santé du système de monitoring
 */
router.get('/health', (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      analytics: {
        status: 'healthy',
        currentStats: analyticsService.getCurrentStats().today
      },
      logging: {
        status: 'healthy',
        stats: loggerService.getLogStats()
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur vérification santé système'
    });
  }
});

module.exports = router;