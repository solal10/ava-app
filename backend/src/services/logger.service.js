const winston = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, '../../logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class LoggerService {
  constructor() {
    this.logger = this.createLogger();
  }

  createLogger() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.prettyPrint()
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return log;
      })
    );

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { service: 'ava-health-coach' },
      transports: [
        new winston.transports.File({
          filename: path.join(LOG_DIR, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          format: logFormat
        }),
        new winston.transports.File({
          filename: path.join(LOG_DIR, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          format: logFormat
        }),
        new winston.transports.File({
          filename: path.join(LOG_DIR, 'http.log'),
          level: 'http',
          maxsize: 5242880, // 5MB
          maxFiles: 3,
          format: logFormat
        })
      ]
    });

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
      }));
    }
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  http(message, meta = {}) {
    this.logger.http(message, meta);
  }

  // Specific logging methods for different app events
  logUserRegistration(userId, email, registrationMethod = 'email') {
    this.info('User registered', {
      event: 'user_registration',
      userId,
      email,
      registrationMethod,
      timestamp: new Date().toISOString()
    });
  }

  logUserLogin(userId, email, loginMethod = 'email') {
    this.info('User logged in', {
      event: 'user_login',
      userId,
      email,
      loginMethod,
      timestamp: new Date().toISOString()
    });
  }

  logHealthDataSubmission(userId, dataType, dataCount) {
    this.info('Health data submitted', {
      event: 'health_data_submission',
      userId,
      dataType,
      dataCount,
      timestamp: new Date().toISOString()
    });
  }

  logMealAnalysis(userId, analysisResult, processingTime) {
    this.info('Meal analysis completed', {
      event: 'meal_analysis',
      userId,
      analysisResult: {
        detected: analysisResult.detected || false,
        confidence: analysisResult.confidence || 0,
        calories: analysisResult.calories || 0
      },
      processingTime,
      timestamp: new Date().toISOString()
    });
  }

  logAiChatInteraction(userId, provider, messageCount, responseTime) {
    this.info('AI chat interaction', {
      event: 'ai_chat_interaction',
      userId,
      provider,
      messageCount,
      responseTime,
      timestamp: new Date().toISOString()
    });
  }

  logSubscriptionEvent(userId, eventType, subscriptionTier, amount = null) {
    this.info('Subscription event', {
      event: 'subscription_event',
      userId,
      eventType, // created, upgraded, downgraded, cancelled, renewed
      subscriptionTier,
      amount,
      timestamp: new Date().toISOString()
    });
  }

  logEmailSent(recipient, emailType, provider, status, error = null) {
    const logLevel = status === 'success' ? 'info' : 'error';
    this[logLevel]('Email sent', {
      event: 'email_sent',
      recipient,
      emailType,
      provider,
      status,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  }

  logGarminSync(userId, syncType, status, dataPoints = 0, error = null) {
    const logLevel = status === 'success' ? 'info' : 'error';
    this[logLevel]('Garmin sync', {
      event: 'garmin_sync',
      userId,
      syncType, // activities, health_metrics, sleep_data
      status,
      dataPoints,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  }

  logApiError(req, error, statusCode = 500) {
    this.error('API Error', {
      event: 'api_error',
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.userId || 'anonymous',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      statusCode,
      timestamp: new Date().toISOString()
    });
  }

  logSecurityEvent(eventType, details, severity = 'medium') {
    const logLevel = severity === 'high' ? 'error' : 'warn';
    this[logLevel]('Security event', {
      event: 'security_event',
      eventType, // rate_limit_exceeded, invalid_token, suspicious_activity
      details,
      severity,
      timestamp: new Date().toISOString()
    });
  }

  logPerformanceMetric(operation, duration, metadata = {}) {
    this.info('Performance metric', {
      event: 'performance_metric',
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  // Method to get log statistics
  getLogStats() {
    return {
      logDirectory: LOG_DIR,
      logLevel: this.logger.level,
      transports: this.logger.transports.length,
      timestamp: new Date().toISOString()
    };
  }

  // Method to rotate logs manually
  rotateLogs() {
    this.logger.info('Manual log rotation triggered');
    // Winston handles rotation automatically based on maxFiles and maxsize
  }
}

// Create singleton instance
const loggerService = new LoggerService();

module.exports = loggerService;