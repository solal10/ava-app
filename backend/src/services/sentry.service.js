const Sentry = require('@sentry/node');

let ProfilingIntegration = null;
try {
  ProfilingIntegration = require('@sentry/profiling-node').ProfilingIntegration;
} catch (error) {
  console.warn('⚠️ Sentry profiling non disponible:', error.message);
}

/**
 * Service de monitoring et gestion d'erreurs avec Sentry
 * Intégration complète pour AVA Coach Santé IA
 */
class SentryService {
  constructor() {
    this.isInitialized = false;
    this.dsn = process.env.SENTRY_DSN;
    this.environment = process.env.NODE_ENV || 'development';
    this.release = process.env.SENTRY_RELEASE || 'ava-coach-sante@1.0.0';
    
    console.log('🔍 Initialisation SentryService...');
  }

  /**
   * Initialiser Sentry avec la configuration complète
   */
  initialize() {
    try {
      if (!this.dsn) {
        console.warn('⚠️ SENTRY_DSN non configuré - Monitoring désactivé');
        return false;
      }

      Sentry.init({
        dsn: this.dsn,
        environment: this.environment,
        release: this.release,
        
        // Configuration du sampling
        tracesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
        
        // Intégrations
        integrations: [
          // Profiling pour les performances (conditionnel)
          ...(ProfilingIntegration ? [new ProfilingIntegration()] : []),
          
          // Intégration Express automatique
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: null }),
          
          // Intégration MongoDB
          new Sentry.Integrations.Mongo({ useMongoose: true }),
          
          // Intégration Node.js natifs
          new Sentry.Integrations.OnUncaughtException({
            exitEvenIfOtherHandlersAreRegistered: false,
          }),
          new Sentry.Integrations.OnUnhandledRejection({
            mode: 'warn'
          }),
        ],

        // Configuration des traces
        beforeSend(event, hint) {
          // Filtrer les informations sensibles
          if (event.request) {
            // Ne pas envoyer les mots de passe
            if (event.request.data && typeof event.request.data === 'object') {
              delete event.request.data.password;
              delete event.request.data.currentPassword;
              delete event.request.data.newPassword;
            }
            
            // Masquer les tokens JWT
            if (event.request.headers && event.request.headers.authorization) {
              event.request.headers.authorization = '[Filtered]';
            }
          }

          // Filtrer certaines erreurs communes
          if (event.exception) {
            const error = hint.originalException;
            if (error && error.message) {
              // Ignorer les erreurs de connexion réseau temporaires
              if (error.message.includes('ECONNRESET') || 
                  error.message.includes('ETIMEDOUT')) {
                return null;
              }
            }
          }

          return event;
        },

        // Tags par défaut
        initialScope: {
          tags: {
            component: 'backend',
            service: 'ava-coach-sante'
          },
          level: 'info'
        }
      });

      this.isInitialized = true;
      console.log('✅ Sentry initialisé avec succès');
      console.log(`📊 Environment: ${this.environment}`);
      console.log(`🏷️ Release: ${this.release}`);

      // Test de configuration
      this.captureMessage('Sentry initialisé avec succès', 'info');

      return true;

    } catch (error) {
      console.error('❌ Erreur initialisation Sentry:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Middleware Express pour Sentry
   */
  getRequestHandler() {
    if (!this.isInitialized) {
      return (req, res, next) => next();
    }
    return Sentry.Handlers.requestHandler();
  }

  /**
   * Middleware de gestion d'erreurs pour Express
   */
  getErrorHandler() {
    if (!this.isInitialized) {
      return (error, req, res, next) => next(error);
    }
    return Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capturer toutes les erreurs 4xx et 5xx
        return error.status >= 400;
      }
    });
  }

  /**
   * Middleware de tracing pour les performances
   */
  getTracingHandler() {
    if (!this.isInitialized) {
      return (req, res, next) => next();
    }
    return Sentry.Handlers.tracingHandler();
  }

  /**
   * Capturer une exception
   */
  captureException(error, context = {}) {
    if (!this.isInitialized) {
      console.error('Exception (Sentry désactivé):', error);
      return null;
    }

    return Sentry.withScope(scope => {
      // Ajouter le contexte
      if (context.user) {
        scope.setUser({
          id: context.user.id,
          username: context.user.username,
          email: context.user.email
        });
      }

      if (context.tags) {
        Object.keys(context.tags).forEach(key => {
          scope.setTag(key, context.tags[key]);
        });
      }

      if (context.extra) {
        Object.keys(context.extra).forEach(key => {
          scope.setExtra(key, context.extra[key]);
        });
      }

      if (context.level) {
        scope.setLevel(context.level);
      }

      return Sentry.captureException(error);
    });
  }

  /**
   * Capturer un message
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isInitialized) {
      console.log(`Message (Sentry désactivé) [${level}]:`, message);
      return null;
    }

    return Sentry.withScope(scope => {
      if (context.user) {
        scope.setUser(context.user);
      }

      if (context.tags) {
        Object.keys(context.tags).forEach(key => {
          scope.setTag(key, context.tags[key]);
        });
      }

      scope.setLevel(level);
      return Sentry.captureMessage(message, level);
    });
  }

  /**
   * Démarrer une transaction pour le monitoring des performances
   */
  startTransaction(name, op, description = '') {
    if (!this.isInitialized) {
      return null;
    }

    return Sentry.startTransaction({
      name,
      op,
      description
    });
  }

  /**
   * Ajouter breadcrumb (historique d'actions)
   */
  addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    });
  }

  /**
   * Configurer l'utilisateur pour le contexte
   */
  setUser(user) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setUser({
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      subscription: user.subscription?.plan || 'free'
    });
  }

  /**
   * Ajouter des tags personnalisés
   */
  setTag(key, value) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setTag(key, value);
  }

  /**
   * Ajouter du contexte supplémentaire
   */
  setExtra(key, value) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setExtra(key, value);
  }

  /**
   * Forcer l'envoi des événements en attente
   */
  async flush(timeout = 5000) {
    if (!this.isInitialized) {
      return true;
    }

    try {
      await Sentry.flush(timeout);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du flush Sentry:', error.message);
      return false;
    }
  }

  /**
   * Fermer proprement Sentry
   */
  async close(timeout = 5000) {
    if (!this.isInitialized) {
      return true;
    }

    try {
      await Sentry.close(timeout);
      this.isInitialized = false;
      console.log('✅ Sentry fermé proprement');
      return true;
    } catch (error) {
      console.error('❌ Erreur fermeture Sentry:', error.message);
      return false;
    }
  }

  /**
   * Méthodes de monitoring spécifiques à AVA Coach Santé
   */

  /**
   * Monitorer les erreurs d'API Garmin
   */
  captureGarminError(error, userId, action) {
    return this.captureException(error, {
      tags: {
        service: 'garmin',
        action: action
      },
      extra: {
        userId,
        action,
        timestamp: new Date().toISOString()
      },
      level: 'error'
    });
  }

  /**
   * Monitorer les erreurs d'IA
   */
  captureAIError(error, provider, userId, query) {
    return this.captureException(error, {
      tags: {
        service: 'ai',
        provider: provider // 'openai', 'anthropic', etc.
      },
      extra: {
        userId,
        provider,
        queryLength: query ? query.length : 0,
        timestamp: new Date().toISOString()
      },
      level: 'error'
    });
  }

  /**
   * Monitorer les erreurs de paiement
   */
  capturePaymentError(error, userId, amount, currency = 'EUR') {
    return this.captureException(error, {
      tags: {
        service: 'payment',
        currency: currency
      },
      extra: {
        userId,
        amount,
        currency,
        timestamp: new Date().toISOString()
      },
      level: 'error'
    });
  }

  /**
   * Monitorer les métriques de performance
   */
  capturePerformanceMetric(name, value, unit = 'ms', tags = {}) {
    if (!this.isInitialized) {
      return;
    }

    this.addBreadcrumb(
      `Performance: ${name} = ${value}${unit}`,
      'performance',
      'info',
      { value, unit, ...tags }
    );
  }

  /**
   * Obtenir le statut du service
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      environment: this.environment,
      release: this.release,
      hasDSN: !!this.dsn
    };
  }
}

// Instance singleton
module.exports = new SentryService();