const loggerService = require('../services/logger.service');

class EnvironmentValidator {
  constructor() {
    this.requiredVars = {
      production: [
        'NODE_ENV',
        'PORT', 
        'MONGODB_URI',
        'JWT_SECRET',
        'CORS_ORIGIN',
        'SPOONACULAR_API_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'FROM_EMAIL',
        'EMAIL_PROVIDER'
      ],
      staging: [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI', 
        'JWT_SECRET',
        'CORS_ORIGIN',
        'SPOONACULAR_API_KEY',
        'FROM_EMAIL',
        'EMAIL_PROVIDER'
      ],
      development: [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET'
      ]
    };

    this.optionalVars = [
      'REDIS_URL',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'GARMIN_CLIENT_ID',
      'GARMIN_CLIENT_SECRET',
      'GARMIN_CONSUMER_KEY',
      'GARMIN_CONSUMER_SECRET',
      'FIREBASE_PROJECT_ID',
      'SENDGRID_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'GMAIL_USER',
      'GMAIL_APP_PASSWORD',
      'MAX_FILE_SIZE',
      'LOG_LEVEL',
      'RATE_LIMIT_WINDOW_MS',
      'RATE_LIMIT_MAX_REQUESTS'
    ];

    this.validationRules = {
      JWT_SECRET: (value) => value && value.length >= 32,
      PORT: (value) => !isNaN(value) && parseInt(value) > 0 && parseInt(value) < 65536,
      MONGODB_URI: (value) => value && value.startsWith('mongodb'),
      EMAIL_PROVIDER: (value) => ['sendgrid', 'ses', 'gmail', 'test'].includes(value),
      NODE_ENV: (value) => ['development', 'staging', 'production', 'test'].includes(value)
    };
  }

  validate() {
    const env = process.env.NODE_ENV || 'development';
    const required = this.requiredVars[env] || this.requiredVars.development;
    
    const results = {
      isValid: true,
      missing: [],
      invalid: [],
      warnings: [],
      environment: env,
      timestamp: new Date().toISOString()
    };

    loggerService.info('Starting environment validation', { environment: env });

    // Check required variables
    for (const varName of required) {
      const value = process.env[varName];
      
      if (!value) {
        results.missing.push(varName);
        results.isValid = false;
        loggerService.error(`Missing required environment variable: ${varName}`);
      } else if (this.validationRules[varName]) {
        if (!this.validationRules[varName](value)) {
          results.invalid.push(varName);
          results.isValid = false;
          loggerService.error(`Invalid value for environment variable: ${varName}`);
        }
      }
    }

    // Check optional variables and warn if missing important ones
    this.checkOptionalVariables(results, env);

    // Environment-specific validations
    this.environmentSpecificValidation(results, env);

    // Log validation results
    if (results.isValid) {
      loggerService.info('Environment validation successful', {
        environment: env,
        warningsCount: results.warnings.length
      });
    } else {
      loggerService.error('Environment validation failed', {
        environment: env,
        missingCount: results.missing.length,
        invalidCount: results.invalid.length
      });
    }

    return results;
  }

  checkOptionalVariables(results, env) {
    // Check email configuration
    if (!process.env.SENDGRID_API_KEY && !process.env.AWS_ACCESS_KEY_ID && !process.env.GMAIL_USER) {
      results.warnings.push('No email service configured (SENDGRID_API_KEY, AWS_ACCESS_KEY_ID, or GMAIL_USER)');
    }

    // Check AI services
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      results.warnings.push('No AI service configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)');
    }

    // Check Garmin integration
    const garminVars = ['GARMIN_CLIENT_ID', 'GARMIN_CLIENT_SECRET', 'GARMIN_CONSUMER_KEY', 'GARMIN_CONSUMER_SECRET'];
    const missingGarmin = garminVars.filter(v => !process.env[v]);
    if (missingGarmin.length > 0 && missingGarmin.length < garminVars.length) {
      results.warnings.push(`Incomplete Garmin configuration. Missing: ${missingGarmin.join(', ')}`);
    }

    // Check Redis
    if (!process.env.REDIS_URL) {
      results.warnings.push('Redis not configured (REDIS_URL) - caching will be disabled');
    }

    // Check Firebase for push notifications
    const firebaseVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
    const missingFirebase = firebaseVars.filter(v => !process.env[v]);
    if (missingFirebase.length > 0 && missingFirebase.length < firebaseVars.length) {
      results.warnings.push(`Incomplete Firebase configuration. Missing: ${missingFirebase.join(', ')}`);
    }
  }

  environmentSpecificValidation(results, env) {
    if (env === 'production') {
      // Production-specific validations
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
        results.warnings.push('JWT_SECRET should be at least 64 characters in production');
      }

      if (process.env.CORS_ORIGIN && (process.env.CORS_ORIGIN.includes('localhost') || process.env.CORS_ORIGIN.includes('127.0.0.1'))) {
        results.warnings.push('CORS_ORIGIN should not include localhost in production');
      }

      if (!process.env.SSL_ENABLED || process.env.SSL_ENABLED !== 'true') {
        results.warnings.push('Consider enabling SSL in production (SSL_ENABLED=true)');
      }

      // Check for test keys in production
      if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('test')) {
        results.invalid.push('STRIPE_SECRET_KEY');
        results.isValid = false;
        loggerService.error('Test Stripe keys detected in production environment');
      }
    }

    if (env === 'development') {
      // Development-specific recommendations
      if (!process.env.LOG_LEVEL || process.env.LOG_LEVEL !== 'debug') {
        results.warnings.push('Consider setting LOG_LEVEL=debug for development');
      }
    }
  }

  generateConfigurationReport() {
    const validation = this.validate();
    const report = {
      ...validation,
      configuration: {
        database: {
          mongodb: !!process.env.MONGODB_URI,
          redis: !!process.env.REDIS_URL
        },
        external_services: {
          spoonacular: !!process.env.SPOONACULAR_API_KEY,
          openai: !!process.env.OPENAI_API_KEY,
          anthropic: !!process.env.ANTHROPIC_API_KEY,
          stripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY),
          garmin: !!(process.env.GARMIN_CLIENT_ID && process.env.GARMIN_CLIENT_SECRET)
        },
        email_services: {
          sendgrid: !!process.env.SENDGRID_API_KEY,
          aws_ses: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
          gmail: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
        },
        notifications: {
          firebase: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY)
        },
        security: {
          jwt_configured: !!process.env.JWT_SECRET,
          cors_configured: !!process.env.CORS_ORIGIN,
          rate_limiting: !!(process.env.RATE_LIMIT_WINDOW_MS && process.env.RATE_LIMIT_MAX_REQUESTS)
        }
      }
    };

    return report;
  }

  validateAndExit() {
    const validation = this.validate();
    
    if (!validation.isValid) {
      console.error('❌ Environment validation failed:');
      if (validation.missing.length > 0) {
        console.error('Missing required variables:', validation.missing.join(', '));
      }
      if (validation.invalid.length > 0) {
        console.error('Invalid variables:', validation.invalid.join(', '));
      }
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️  Environment warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    console.log('✅ Environment validation passed');
    return validation;
  }
}

module.exports = new EnvironmentValidator();