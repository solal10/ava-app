const loggerService = require('../services/logger.service');
const analyticsService = require('../services/analytics.service');

/**
 * Middleware pour l'intégration automatique des analytics et logging
 */

/**
 * Middleware principal pour tracker toutes les requêtes
 */
const trackRequest = (req, res, next) => {
  const startTime = Date.now();

  // Ajouter des infos de tracking à la requête
  req.trackingInfo = {
    startTime,
    requestId: generateRequestId(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    method: req.method,
    path: req.path,
    query: req.query
  };

  // Log de la requête entrante
  loggerService.http(`${req.method} ${req.path}`, {
    requestId: req.trackingInfo.requestId,
    userAgent: req.trackingInfo.userAgent,
    ip: req.trackingInfo.ip,
    userId: req.user?._id || 'anonymous'
  });

  // Tracker l'utilisateur si authentifié
  if (req.user) {
    analyticsService.trackUser(req.user._id.toString(), false);
    
    // Démarrer/continuer la session
    analyticsService.trackSession(req.user._id.toString(), 'activity', {
      endpoint: req.path,
      method: req.method,
      userAgent: req.trackingInfo.userAgent
    });
  }

  // Intercepter la réponse pour mesurer le temps
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log de la réponse
    loggerService.http(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      requestId: req.trackingInfo.requestId,
      statusCode: res.statusCode,
      responseTime: duration,
      userId: req.user?._id || 'anonymous'
    });

    // Tracker les performances
    analyticsService.trackPerformance(
      `api_${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`,
      duration,
      {
        statusCode: res.statusCode,
        userId: req.user?._id?.toString(),
        endpoint: req.path
      }
    );

    // Tracker les erreurs si status >= 400
    if (res.statusCode >= 400) {
      analyticsService.trackError(new Error(`HTTP ${res.statusCode}`), {
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        userId: req.user?._id?.toString()
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware pour tracker les fonctionnalités spécifiques
 */
const trackFeature = (featureName) => {
  return (req, res, next) => {
    if (req.user) {
      analyticsService.trackFeature(featureName, req.user._id.toString(), {
        endpoint: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

/**
 * Middleware pour tracker les nouvelles inscriptions
 */
const trackNewUser = (req, res, next) => {
  // Ajouter une fonction helper à la réponse pour tracker après création
  res.trackNewUser = (userId) => {
    if (userId) {
      analyticsService.trackUser(userId.toString(), true);
      loggerService.logUserRegistration(
        userId.toString(),
        req.body.email,
        req.body.registrationMethod || 'email'
      );
    }
  };
  next();
};

/**
 * Middleware pour tracker les connexions
 */
const trackLogin = (req, res, next) => {
  res.trackLogin = (user) => {
    if (user) {
      analyticsService.trackUser(user._id.toString(), false);
      loggerService.logUserLogin(
        user._id.toString(),
        user.email,
        req.body.loginMethod || 'email'
      );
      
      // Démarrer une nouvelle session
      analyticsService.trackSession(user._id.toString(), 'start', {
        loginMethod: req.body.loginMethod || 'email',
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
  };
  next();
};

/**
 * Middleware pour tracker les interactions IA
 */
const trackAI = (provider = 'unknown') => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.trackAI = (success, requestType = 'chat') => {
      const duration = Date.now() - startTime;
      
      if (req.user) {
        analyticsService.trackAIUsage(
          req.user._id.toString(),
          provider,
          requestType,
          success,
          duration
        );
      }

      loggerService.logAiChatInteraction(
        req.user?._id?.toString() || 'anonymous',
        provider,
        1,
        duration
      );
    };
    next();
  };
};

/**
 * Middleware pour tracker les synchronisations Garmin
 */
const trackGarmin = (req, res, next) => {
  const startTime = Date.now();
  
  res.trackGarmin = (syncType, success, dataPoints = 0) => {
    const duration = Date.now() - startTime;
    
    if (req.user) {
      analyticsService.trackGarminSync(
        req.user._id.toString(),
        syncType,
        success,
        dataPoints,
        duration
      );
    }

    loggerService.logGarminSync(
      req.user?._id?.toString() || 'anonymous',
      syncType,
      success ? 'success' : 'failed',
      dataPoints,
      success ? null : new Error('Sync failed')
    );
  };
  next();
};

/**
 * Middleware pour tracker les analyses de repas
 */
const trackMeal = (req, res, next) => {
  const startTime = Date.now();
  
  res.trackMeal = (success, confidence = 0) => {
    const duration = Date.now() - startTime;
    
    if (req.user) {
      analyticsService.trackMealAnalysis(
        req.user._id.toString(),
        success,
        confidence,
        duration
      );
    }

    loggerService.logMealAnalysis(
      req.user?._id?.toString() || 'anonymous',
      { detected: success, confidence },
      duration
    );
  };
  next();
};

/**
 * Middleware pour tracker les changements d'abonnement
 */
const trackSubscription = (req, res, next) => {
  res.trackSubscription = (eventType, subscriptionData) => {
    if (req.user) {
      loggerService.logSubscriptionEvent(
        req.user._id.toString(),
        eventType,
        subscriptionData.tier || subscriptionData.plan,
        subscriptionData.amount
      );

      // Tracker la métrique business si c'est un upgrade/nouveau
      if (eventType === 'created' || eventType === 'upgraded') {
        analyticsService.trackBusinessMetric('subscription_revenue', subscriptionData.amount || 0, {
          plan: subscriptionData.tier || subscriptionData.plan,
          eventType,
          userId: req.user._id.toString()
        });
      }

      // Tracker le changement si upgrade/downgrade
      if (eventType === 'upgraded' || eventType === 'downgraded') {
        analyticsService.trackSubscriptionChange(
          req.user._id.toString(),
          subscriptionData.fromPlan || 'unknown',
          subscriptionData.toPlan || subscriptionData.plan,
          subscriptionData.amount || 0,
          subscriptionData.currency || 'EUR'
        );
      }
    }
  };
  next();
};

/**
 * Middleware pour tracker les emails
 */
const trackEmail = (req, res, next) => {
  res.trackEmail = (recipient, emailType, provider, success, error = null) => {
    loggerService.logEmailSent(
      recipient,
      emailType,
      provider,
      success ? 'success' : 'failed',
      error
    );

    if (success) {
      analyticsService.trackBusinessMetric('email_sent', 1, {
        emailType,
        provider,
        recipient: recipient.substring(0, 3) + '***' // Masquer l'email pour privacy
      });
    }
  };
  next();
};

/**
 * Middleware pour gérer les erreurs avec tracking automatique
 */
const trackError = (err, req, res, next) => {
  // Log de l'erreur
  loggerService.logApiError(req, err, res.statusCode || 500);
  
  // Tracker l'erreur dans analytics
  analyticsService.trackError(err, {
    endpoint: req.path,
    method: req.method,
    userId: req.user?._id?.toString(),
    statusCode: res.statusCode || 500,
    requestId: req.trackingInfo?.requestId
  });

  next(err);
};

/**
 * Générer un ID unique pour les requêtes
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Middleware pour obtenir les statistiques (endpoint admin)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const report = await analyticsService.generateReport(days);
    const currentStats = analyticsService.getCurrentStats();
    
    res.json({
      success: true,
      data: {
        current: currentStats,
        report: report,
        logger: loggerService.getLogStats()
      }
    });
  } catch (error) {
    loggerService.error('Erreur récupération analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erreur récupération analytics'
    });
  }
};

module.exports = {
  trackRequest,
  trackFeature,
  trackNewUser,
  trackLogin,
  trackAI,
  trackGarmin,
  trackMeal,
  trackSubscription,
  trackEmail,
  trackError,
  getAnalytics
};