const fs = require('fs');
const path = require('path');

/**
 * Service de gestion de configuration AVA Coach Santé IA
 * Gère les différents environnements (development, staging, production)
 */
class ConfigService {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  /**
   * Charger la configuration selon l'environnement
   */
  loadConfiguration() {
    const baseConfig = {
      // Configuration de base commune à tous les environnements
      app: {
        name: 'AVA Coach Santé IA',
        version: process.env.npm_package_version || '1.0.0',
        port: parseInt(process.env.PORT) || 5003,
        environment: this.environment,
        maxFileSize: process.env.MAX_FILE_SIZE || '50mb'
      },
      database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coach_sante_db',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      },
      cors: {
        origins: this.getCorsOrigins(),
        credentials: true
      },
      security: {
        jwt: {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        },
        rateLimiting: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15min
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100
        }
      },
      apis: {
        spoonacular: {
          apiKey: process.env.SPOONACULAR_API_KEY,
          baseUrl: 'https://api.spoonacular.com'
        },
        stripe: {
          secretKey: process.env.STRIPE_SECRET_KEY,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
        },
        garmin: {
          clientId: process.env.GARMIN_CLIENT_ID,
          clientSecret: process.env.GARMIN_CLIENT_SECRET,
          consumerKey: process.env.GARMIN_CONSUMER_KEY,
          consumerSecret: process.env.GARMIN_CONSUMER_SECRET,
          redirectUri: process.env.GARMIN_REDIRECT_URI || 'http://localhost:5003/auth/garmin/callback'
        },
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
        },
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
        }
      },
      email: {
        provider: process.env.EMAIL_PROVIDER || 'gmail',
        from: process.env.FROM_EMAIL || 'noreply@ava-coach-sante.com',
        sendgrid: {
          apiKey: process.env.SENDGRID_API_KEY
        },
        gmail: {
          user: process.env.GMAIL_USER,
          appPassword: process.env.GMAIL_APP_PASSWORD
        },
        aws: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'eu-west-1'
        }
      },
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL
      },
      monitoring: {
        sentry: {
          dsn: process.env.SENTRY_DSN,
          release: process.env.SENTRY_RELEASE || `ava-coach-sante@${this.config?.app?.version || '1.0.0'}`,
          environment: this.environment,
          tracesSampleRate: this.getTracesSampleRate(),
          profilesSampleRate: this.getProfilesSampleRate()
        },
        analytics: {
          enabled: process.env.ANALYTICS_ENABLED !== 'false',
          retention: parseInt(process.env.ANALYTICS_RETENTION) || 90
        }
      },
      backup: {
        enabled: process.env.BACKUP_ENABLED !== 'false',
        schedule: {
          daily: process.env.BACKUP_DAILY_TIME || '02:00',
          weekly: process.env.BACKUP_WEEKLY_TIME || '03:00',
          monthly: process.env.BACKUP_MONTHLY_TIME || '04:00'
        },
        retention: {
          daily: parseInt(process.env.BACKUP_DAILY_RETENTION) || 7,
          weekly: parseInt(process.env.BACKUP_WEEKLY_RETENTION) || 4,
          monthly: parseInt(process.env.BACKUP_MONTHLY_RETENTION) || 6
        },
        compression: process.env.BACKUP_COMPRESSION !== 'false',
        encryption: {
          enabled: process.env.BACKUP_ENCRYPTION === 'true',
          key: process.env.BACKUP_ENCRYPTION_KEY
        },
        remote: {
          enabled: process.env.BACKUP_REMOTE_ENABLED === 'true',
          type: process.env.BACKUP_REMOTE_TYPE || 's3',
          s3: {
            bucket: process.env.BACKUP_S3_BUCKET,
            region: process.env.BACKUP_S3_REGION || 'eu-west-1'
          }
        }
      },
      frontend: {
        url: process.env.FRONTEND_URL || this.getDefaultFrontendUrl()
      },
      logging: {
        level: this.getLogLevel(),
        format: process.env.LOG_FORMAT || 'json',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 14,
        maxSize: process.env.LOG_MAX_SIZE || '20m'
      }
    };

    // Appliquer les configurations spécifiques à l'environnement
    return this.applyEnvironmentConfig(baseConfig);
  }

  /**
   * Appliquer les configurations spécifiques à l'environnement
   */
  applyEnvironmentConfig(baseConfig) {
    const envConfigs = {
      development: {
        database: {
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coach_sante_dev'
        },
        cors: {
          origins: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173']
        },
        monitoring: {
          sentry: {
            enabled: false // Désactiver Sentry en dev par défaut
          }
        },
        logging: {
          level: 'debug'
        },
        security: {
          rateLimiting: {
            maxRequests: 1000 // Plus permissif en dev
          }
        }
      },
      staging: {
        database: {
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coach_sante_staging'
        },
        cors: {
          origins: [process.env.STAGING_FRONTEND_URL || 'https://staging.ava-coach-sante.com']
        },
        monitoring: {
          sentry: {
            enabled: true,
            tracesSampleRate: 0.5
          }
        },
        logging: {
          level: 'info'
        },
        security: {
          rateLimiting: {
            maxRequests: 200
          }
        }
      },
      production: {
        database: {
          uri: process.env.MONGODB_URI // Obligatoire en prod
        },
        cors: {
          origins: [process.env.PRODUCTION_FRONTEND_URL || 'https://ava-coach-sante.com']
        },
        monitoring: {
          sentry: {
            enabled: true,
            tracesSampleRate: 0.1
          }
        },
        logging: {
          level: 'warn'
        },
        security: {
          rateLimiting: {
            maxRequests: 100
          }
        },
        apis: {
          stripe: {
            // Utiliser les clés de production Stripe
            secretKey: process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY,
            publishableKey: process.env.STRIPE_LIVE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
          }
        }
      },
      test: {
        database: {
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coach_sante_test'
        },
        monitoring: {
          sentry: {
            enabled: false
          },
          analytics: {
            enabled: false
          }
        },
        logging: {
          level: 'error'
        },
        backup: {
          enabled: false
        }
      }
    };

    const envConfig = envConfigs[this.environment] || {};
    return this.deepMerge(baseConfig, envConfig);
  }

  /**
   * Obtenir les origines CORS selon l'environnement
   */
  getCorsOrigins() {
    const origins = [];
    
    if (process.env.CORS_ORIGIN) {
      origins.push(process.env.CORS_ORIGIN);
    }

    // Origines supplémentaires selon l'environnement
    switch (this.environment) {
      case 'development':
        origins.push('http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173');
        break;
      case 'staging':
        origins.push(process.env.STAGING_FRONTEND_URL || 'https://staging.ava-coach-sante.com');
        break;
      case 'production':
        origins.push(process.env.PRODUCTION_FRONTEND_URL || 'https://ava-coach-sante.com');
        break;
    }

    return [...new Set(origins)]; // Supprimer les doublons
  }

  /**
   * Obtenir l'URL frontend par défaut
   */
  getDefaultFrontendUrl() {
    switch (this.environment) {
      case 'production':
        return 'https://ava-coach-sante.com';
      case 'staging':
        return 'https://staging.ava-coach-sante.com';
      default:
        return 'http://localhost:5173';
    }
  }

  /**
   * Obtenir le niveau de log selon l'environnement
   */
  getLogLevel() {
    if (process.env.LOG_LEVEL) {
      return process.env.LOG_LEVEL;
    }

    switch (this.environment) {
      case 'production':
        return 'warn';
      case 'staging':
        return 'info';
      case 'test':
        return 'error';
      default:
        return 'debug';
    }
  }

  /**
   * Obtenir le taux d'échantillonnage Sentry traces
   */
  getTracesSampleRate() {
    if (process.env.SENTRY_TRACES_SAMPLE_RATE) {
      return parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE);
    }

    switch (this.environment) {
      case 'production':
        return 0.1;
      case 'staging':
        return 0.5;
      case 'development':
        return 1.0;
      default:
        return 0.1;
    }
  }

  /**
   * Obtenir le taux d'échantillonnage Sentry profiling
   */
  getProfilesSampleRate() {
    if (process.env.SENTRY_PROFILES_SAMPLE_RATE) {
      return parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE);
    }

    switch (this.environment) {
      case 'production':
        return 0.1;
      case 'staging':
        return 0.1;
      default:
        return 0;
    }
  }

  /**
   * Valider la configuration critique
   */
  validateConfiguration() {
    const required = {
      production: [
        'MONGODB_URI',
        'JWT_SECRET',
        'SENTRY_DSN'
      ],
      staging: [
        'MONGODB_URI',
        'JWT_SECRET'
      ],
      development: [
        'JWT_SECRET'
      ]
    };

    const envRequired = required[this.environment] || [];
    const missing = [];

    envRequired.forEach(key => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });

    if (missing.length > 0) {
      const error = `Variables d'environnement manquantes pour ${this.environment}: ${missing.join(', ')}`;
      throw new Error(error);
    }

    // Validations spécifiques
    this.validateSecrets();
    this.validateUrls();
  }

  /**
   * Valider les secrets et clés
   */
  validateSecrets() {
    // JWT Secret doit être suffisamment long
    if (this.config.security.jwt.secret && this.config.security.jwt.secret.length < 32) {
      throw new Error('JWT_SECRET doit contenir au moins 32 caractères');
    }

    // Vérifier les clés Stripe en production
    if (this.environment === 'production') {
      const stripeKey = this.config.apis.stripe.secretKey;
      if (stripeKey && stripeKey.startsWith('sk_test_')) {
        console.warn('⚠️ ATTENTION: Clé Stripe de test utilisée en production');
      }
    }
  }

  /**
   * Valider les URLs
   */
  validateUrls() {
    const frontendUrl = this.config.frontend.url;
    
    if (this.environment === 'production' && frontendUrl.includes('localhost')) {
      throw new Error('URL frontend localhost non autorisée en production');
    }

    // Vérifier que l'URL MongoDB est correcte
    const mongoUri = this.config.database.uri;
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      throw new Error('MONGODB_URI format invalide');
    }
  }

  /**
   * Fusionner deux objets en profondeur
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (target[key]) {
          output[key] = this.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      } else {
        output[key] = source[key];
      }
    });

    return output;
  }

  /**
   * Obtenir toute la configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Obtenir une partie spécifique de la configuration
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
  }

  /**
   * Vérifier si on est en développement
   */
  isDevelopment() {
    return this.environment === 'development';
  }

  /**
   * Vérifier si on est en staging
   */
  isStaging() {
    return this.environment === 'staging';
  }

  /**
   * Vérifier si on est en production
   */
  isProduction() {
    return this.environment === 'production';
  }

  /**
   * Vérifier si on est en test
   */
  isTest() {
    return this.environment === 'test';
  }

  /**
   * Obtenir les informations de santé de la configuration
   */
  getHealthCheck() {
    const criticalServices = [];

    // Vérifier les services critiques
    if (!this.config.database.uri) criticalServices.push('database');
    if (!this.config.security.jwt.secret) criticalServices.push('jwt');
    
    if (this.isProduction()) {
      if (!this.config.monitoring.sentry.dsn) criticalServices.push('sentry');
      if (!this.config.apis.stripe.secretKey) criticalServices.push('stripe');
    }

    return {
      environment: this.environment,
      healthy: criticalServices.length === 0,
      criticalServices,
      configuredServices: {
        database: !!this.config.database.uri,
        jwt: !!this.config.security.jwt.secret,
        sentry: !!this.config.monitoring.sentry.dsn,
        stripe: !!this.config.apis.stripe.secretKey,
        spoonacular: !!this.config.apis.spoonacular.apiKey,
        email: !!this.getEmailConfig(),
        firebase: !!this.config.firebase.projectId,
        garmin: !!this.config.apis.garmin.clientId
      }
    };
  }

  /**
   * Obtenir la configuration email active
   */
  getEmailConfig() {
    const provider = this.config.email.provider;
    
    switch (provider) {
      case 'sendgrid':
        return this.config.email.sendgrid.apiKey;
      case 'gmail':
        return this.config.email.gmail.user && this.config.email.gmail.appPassword;
      case 'aws':
        return this.config.email.aws.accessKeyId && this.config.email.aws.secretAccessKey;
      default:
        return false;
    }
  }
}

module.exports = new ConfigService();