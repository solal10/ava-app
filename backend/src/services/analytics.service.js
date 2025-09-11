const fs = require('fs').promises;
const path = require('path');
const loggerService = require('./logger.service');

/**
 * Service d'analytics et métriques business pour AVA Coach Santé IA
 * Collecte et analyse les données d'usage, performance et business
 */
class AnalyticsService {
  constructor() {
    this.metricsCache = new Map();
    this.metricsFile = path.join(__dirname, '../../analytics/metrics.json');
    this.sessionsFile = path.join(__dirname, '../../analytics/sessions.json');
    this.businessFile = path.join(__dirname, '../../analytics/business.json');
    
    this.dailyStats = {
      users: {
        active: new Set(),
        new: new Set(),
        returning: new Set()
      },
      features: {},
      errors: 0,
      performance: []
    };

    // Réinitialiser les stats quotidiennes à minuit
    this.scheduleDaily();
    
    console.log('📊 Analytics Service initialisé');
  }

  /**
   * Initialiser les dossiers et fichiers
   */
  async initialize() {
    try {
      const analyticsDir = path.dirname(this.metricsFile);
      await fs.mkdir(analyticsDir, { recursive: true });
      
      // Initialiser les fichiers s'ils n'existent pas
      const files = [this.metricsFile, this.sessionsFile, this.businessFile];
      
      for (const file of files) {
        try {
          await fs.access(file);
        } catch {
          await fs.writeFile(file, JSON.stringify({
            created: new Date().toISOString(),
            data: []
          }, null, 2));
        }
      }
      
      loggerService.info('Analytics service initialisé');
    } catch (error) {
      loggerService.error('Erreur initialisation analytics', { error: error.message });
    }
  }

  /**
   * Programmer le reset quotidien des statistiques
   */
  scheduleDaily() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
      this.saveDailyStats();
      this.resetDailyStats();
      
      // Programmer pour chaque jour suivant
      setInterval(() => {
        this.saveDailyStats();
        this.resetDailyStats();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  /**
   * Sauvegarder les statistiques quotidiennes
   */
  async saveDailyStats() {
    try {
      const date = new Date().toISOString().split('T')[0];
      const stats = {
        date,
        users: {
          activeCount: this.dailyStats.users.active.size,
          newCount: this.dailyStats.users.new.size,
          returningCount: this.dailyStats.users.returning.size
        },
        features: this.dailyStats.features,
        errors: this.dailyStats.errors,
        performance: this.calculatePerformanceStats(),
        timestamp: new Date().toISOString()
      };

      await this.appendToFile(this.metricsFile, stats);
      
      loggerService.info('Stats quotidiennes sauvegardées', {
        date,
        activeUsers: stats.users.activeCount,
        newUsers: stats.users.newCount
      });
    } catch (error) {
      loggerService.error('Erreur sauvegarde stats quotidiennes', { error: error.message });
    }
  }

  /**
   * Réinitialiser les statistiques quotidiennes
   */
  resetDailyStats() {
    this.dailyStats = {
      users: {
        active: new Set(),
        new: new Set(),
        returning: new Set()
      },
      features: {},
      errors: 0,
      performance: []
    };
  }

  /**
   * Calculer les statistiques de performance
   */
  calculatePerformanceStats() {
    if (this.dailyStats.performance.length === 0) {
      return null;
    }

    const times = this.dailyStats.performance.map(p => p.duration);
    times.sort((a, b) => a - b);

    return {
      count: times.length,
      avg: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: times[0],
      max: times[times.length - 1],
      p50: times[Math.floor(times.length * 0.5)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)]
    };
  }

  /**
   * Ajouter des données à un fichier JSON
   */
  async appendToFile(filePath, data) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      if (!jsonData.data) {
        jsonData.data = [];
      }
      
      jsonData.data.push(data);
      
      // Garder seulement les 1000 dernières entrées
      if (jsonData.data.length > 1000) {
        jsonData.data = jsonData.data.slice(-1000);
      }
      
      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    } catch (error) {
      loggerService.error('Erreur ajout donnée fichier analytics', { 
        file: filePath, 
        error: error.message 
      });
    }
  }

  /**
   * Tracker l'activité d'un utilisateur
   */
  trackUser(userId, isNew = false) {
    if (!userId) return;

    this.dailyStats.users.active.add(userId);
    
    if (isNew) {
      this.dailyStats.users.new.add(userId);
      this.trackBusinessMetric('user_registration', 1);
    } else {
      this.dailyStats.users.returning.add(userId);
    }

    loggerService.info('Utilisateur tracké', {
      userId,
      isNew,
      event: 'user_activity'
    });
  }

  /**
   * Tracker l'utilisation d'une fonctionnalité
   */
  trackFeature(featureName, userId, metadata = {}) {
    if (!this.dailyStats.features[featureName]) {
      this.dailyStats.features[featureName] = {
        count: 0,
        users: new Set(),
        metadata: []
      };
    }

    this.dailyStats.features[featureName].count++;
    this.dailyStats.features[featureName].users.add(userId);
    this.dailyStats.features[featureName].metadata.push({
      userId,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    loggerService.info('Fonctionnalité utilisée', {
      feature: featureName,
      userId,
      metadata,
      event: 'feature_usage'
    });
  }

  /**
   * Tracker les performances
   */
  trackPerformance(operation, duration, metadata = {}) {
    this.dailyStats.performance.push({
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Logger si performance lente
    if (duration > 1000) {
      loggerService.warn('Performance lente détectée', {
        operation,
        duration,
        metadata,
        event: 'slow_performance'
      });
    }
  }

  /**
   * Tracker les erreurs
   */
  trackError(error, context = {}) {
    this.dailyStats.errors++;
    
    const errorData = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    this.appendToFile(this.metricsFile.replace('metrics.json', 'errors.json'), errorData);
    
    loggerService.error('Erreur trackée dans analytics', {
      error: errorData,
      event: 'error_tracked'
    });
  }

  /**
   * Tracker les métriques business
   */
  async trackBusinessMetric(metricName, value, metadata = {}) {
    const businessMetric = {
      metric: metricName,
      value,
      metadata,
      timestamp: new Date().toISOString()
    };

    await this.appendToFile(this.businessFile, businessMetric);
    
    loggerService.info('Métrique business trackée', {
      metric: metricName,
      value,
      metadata,
      event: 'business_metric'
    });
  }

  /**
   * Tracker une session utilisateur
   */
  async trackSession(userId, action, sessionData = {}) {
    const session = {
      userId,
      action, // 'start', 'end', 'activity'
      sessionData,
      timestamp: new Date().toISOString()
    };

    await this.appendToFile(this.sessionsFile, session);
  }

  /**
   * Méthodes spécialisées pour AVA Coach Santé
   */

  /**
   * Tracker l'usage de l'IA
   */
  trackAIUsage(userId, provider, requestType, success, processingTime) {
    this.trackFeature('ai_chat', userId, {
      provider,
      requestType,
      success,
      processingTime
    });

    this.trackPerformance(`ai_${provider}_${requestType}`, processingTime);
    
    if (success) {
      this.trackBusinessMetric('ai_successful_request', 1, { provider, requestType });
    }
  }

  /**
   * Tracker la synchronisation Garmin
   */
  trackGarminSync(userId, syncType, success, dataPoints, processingTime) {
    this.trackFeature('garmin_sync', userId, {
      syncType,
      success,
      dataPoints,
      processingTime
    });

    if (success) {
      this.trackBusinessMetric('garmin_sync_success', 1, { 
        syncType, 
        dataPoints 
      });
    }
  }

  /**
   * Tracker les analyses de repas
   */
  trackMealAnalysis(userId, success, confidence, processingTime) {
    this.trackFeature('meal_analysis', userId, {
      success,
      confidence,
      processingTime
    });

    if (success) {
      this.trackBusinessMetric('meal_analysis_success', 1, { confidence });
    }
  }

  /**
   * Tracker les changements d'abonnement
   */
  trackSubscriptionChange(userId, fromPlan, toPlan, amount, currency) {
    this.trackBusinessMetric('subscription_change', amount, {
      userId,
      fromPlan,
      toPlan,
      currency
    });

    this.trackFeature('subscription_management', userId, {
      action: 'change',
      fromPlan,
      toPlan
    });
  }

  /**
   * Obtenir les statistiques actuelles
   */
  getCurrentStats() {
    return {
      today: {
        activeUsers: this.dailyStats.users.active.size,
        newUsers: this.dailyStats.users.new.size,
        returningUsers: this.dailyStats.users.returning.size,
        totalErrors: this.dailyStats.errors,
        featuresUsed: Object.keys(this.dailyStats.features).length,
        performanceData: this.calculatePerformanceStats()
      },
      features: Object.fromEntries(
        Object.entries(this.dailyStats.features).map(([name, data]) => [
          name, 
          {
            count: data.count,
            uniqueUsers: data.users.size,
            lastUsed: data.metadata[data.metadata.length - 1]?.timestamp
          }
        ])
      ),
      cache: {
        size: this.metricsCache.size,
        keys: Array.from(this.metricsCache.keys())
      }
    };
  }

  /**
   * Obtenir l'historique des métriques
   */
  async getHistoricalData(days = 7) {
    try {
      const files = [this.metricsFile, this.businessFile, this.sessionsFile];
      const historicalData = {};

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const data = JSON.parse(content);
        
        const fileName = path.basename(file, '.json');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        historicalData[fileName] = data.data.filter(item => 
          new Date(item.timestamp) >= cutoffDate
        );
      }

      return historicalData;
    } catch (error) {
      loggerService.error('Erreur récupération données historiques', { 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Générer un rapport d'analytics
   */
  async generateReport(days = 7) {
    const historicalData = await this.getHistoricalData(days);
    const currentStats = this.getCurrentStats();

    if (!historicalData) {
      return null;
    }

    const report = {
      period: `${days} jours`,
      generatedAt: new Date().toISOString(),
      current: currentStats,
      historical: {
        totalMetrics: historicalData.metrics?.length || 0,
        totalSessions: historicalData.sessions?.length || 0,
        totalBusinessEvents: historicalData.business?.length || 0
      },
      insights: this.generateInsights(historicalData, currentStats)
    };

    loggerService.info('Rapport analytics généré', {
      period: report.period,
      totalMetrics: report.historical.totalMetrics
    });

    return report;
  }

  /**
   * Générer des insights à partir des données
   */
  generateInsights(historical, current) {
    const insights = [];

    // Insight sur les utilisateurs actifs
    if (current.today.activeUsers > 0) {
      insights.push({
        type: 'user_activity',
        message: `${current.today.activeUsers} utilisateurs actifs aujourd'hui`,
        data: {
          active: current.today.activeUsers,
          new: current.today.newUsers,
          returning: current.today.returningUsers
        }
      });
    }

    // Insight sur les performances
    const perfData = current.today.performanceData;
    if (perfData && perfData.avg > 500) {
      insights.push({
        type: 'performance_warning',
        message: `Performance moyenne de ${Math.round(perfData.avg)}ms (lente)`,
        data: perfData
      });
    }

    // Insight sur les erreurs
    if (current.today.totalErrors > 10) {
      insights.push({
        type: 'error_alert',
        message: `${current.today.totalErrors} erreurs détectées aujourd'hui`,
        data: { errorCount: current.today.totalErrors }
      });
    }

    return insights;
  }

  /**
   * Nettoyer les anciennes données
   */
  async cleanup(olderThanDays = 90) {
    try {
      const files = [this.metricsFile, this.businessFile, this.sessionsFile];
      let totalCleaned = 0;

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const data = JSON.parse(content);
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const originalLength = data.data.length;
        data.data = data.data.filter(item => 
          new Date(item.timestamp) >= cutoffDate
        );

        const cleaned = originalLength - data.data.length;
        totalCleaned += cleaned;

        if (cleaned > 0) {
          await fs.writeFile(file, JSON.stringify(data, null, 2));
        }
      }

      loggerService.info('Nettoyage analytics terminé', {
        cleanedRecords: totalCleaned,
        olderThanDays
      });

      return totalCleaned;
    } catch (error) {
      loggerService.error('Erreur nettoyage analytics', { 
        error: error.message 
      });
      return 0;
    }
  }
}

// Instance singleton
module.exports = new AnalyticsService();