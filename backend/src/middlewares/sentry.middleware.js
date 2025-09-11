const sentryService = require('../services/sentry.service');

/**
 * Middleware pour l'intégration Sentry dans les contrôleurs
 */

/**
 * Middleware pour capturer le contexte utilisateur
 */
const captureUser = (req, res, next) => {
  if (req.user) {
    sentryService.setUser({
      id: req.user._id || req.user.id,
      username: req.user.username,
      email: req.user.email,
      subscription: req.user.subscription?.plan || 'free'
    });

    // Ajouter des tags utiles
    sentryService.setTag('user.subscription', req.user.subscription?.plan || 'free');
    sentryService.setTag('user.verified', req.user.isEmailVerified || false);
  }

  next();
};

/**
 * Middleware pour capturer les informations de la requête
 */
const captureRequest = (req, res, next) => {
  // Ajouter breadcrumb pour chaque requête API
  sentryService.addBreadcrumb(
    `${req.method} ${req.path}`,
    'http',
    'info',
    {
      method: req.method,
      url: req.path,
      query: req.query,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }
  );

  // Ajouter des tags pour la requête
  sentryService.setTag('http.method', req.method);
  sentryService.setTag('http.route', req.route?.path || req.path);

  next();
};

/**
 * Wrapper pour les contrôleurs async avec gestion d'erreurs Sentry
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch((error) => {
        // Capturer l'erreur avec le contexte complet
        sentryService.captureException(error, {
          user: req.user ? {
            id: req.user._id || req.user.id,
            email: req.user.email
          } : null,
          tags: {
            controller: fn.name || 'anonymous',
            route: req.route?.path || req.path,
            method: req.method
          },
          extra: {
            body: req.body,
            params: req.params,
            query: req.query,
            userAgent: req.get('User-Agent')
          }
        });
        
        next(error);
      });
  };
};

/**
 * Middleware spécialisé pour les erreurs API externes
 */
const captureAPIError = (service) => {
  return (error, req, res, next) => {
    if (error) {
      sentryService.captureException(error, {
        tags: {
          service: service,
          api_error: true
        },
        extra: {
          service: service,
          userId: req.user?._id || req.user?.id,
          endpoint: req.path,
          method: req.method
        }
      });
    }
    next(error);
  };
};

/**
 * Middleware pour monitorer les performances
 */
const performanceMonitoring = (operationName) => {
  return (req, res, next) => {
    const transaction = sentryService.startTransaction(
      operationName,
      'http.server',
      `${req.method} ${req.path}`
    );

    if (transaction) {
      res.locals.sentryTransaction = transaction;
      
      // Finir la transaction quand la réponse est envoyée
      res.on('finish', () => {
        transaction.setHttpStatus(res.statusCode);
        transaction.finish();
      });
    }

    next();
  };
};

/**
 * Helper pour les contrôleurs pour capturer des métriques custom
 */
const captureCustomMetric = (name, value, unit = 'ms', tags = {}) => {
  sentryService.capturePerformanceMetric(name, value, unit, tags);
};

/**
 * Helper pour capturer des messages informatifs
 */
const captureInfo = (message, data = {}) => {
  sentryService.captureMessage(message, 'info', {
    extra: data
  });
};

module.exports = {
  captureUser,
  captureRequest,
  asyncHandler,
  captureAPIError,
  performanceMonitoring,
  captureCustomMetric,
  captureInfo,
  sentryService // Export du service pour utilisation directe
};