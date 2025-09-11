require('dotenv').config();

// IMPORTANT: Sentry doit être initialisé AVANT tous les autres imports
const sentryService = require('./src/services/sentry.service');
sentryService.initialize();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import des routes
const userRoutes = require('./src/api/user/user.routes');
const stateRoutes = require('./src/api/state/state.routes');
const iaRoutes = require('./src/api/ia/ia.routes');
const subscriptionRoutes = require('./src/api/subscription/subscription.routes');
const healthRoutes = require('./src/api/health/health.routes');
const mealRoutes = require('./src/api/meal/meal.routes');
const learnRoutes = require('./routes/learn.routes');
const garminRoutes = require('./src/api/garmin/garmin.routes');
const notificationRoutes = require('./src/api/notification/notification.routes');
const emailRoutes = require('./src/api/email/email.routes');
const analyticsRoutes = require('./src/api/analytics/analytics.routes');
const backupRoutes = require('./src/api/backup/backup.routes');
const gdprRoutes = require('./src/api/gdpr/gdpr.routes');
const legalRoutes = require('./src/api/legal/legal.routes');

// Configuration
const app = express();
const PORT = process.env.PORT || 5003;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '50mb';

// Import des middlewares
const { rateLimit } = require('./src/middlewares/auth.middleware');
const { sanitizeInput } = require('./src/middlewares/validation.middleware');
const { helmetConfig, authLimiter, generalLimiter, securityMiddleware } = require('./src/middlewares/security.middleware');
const { register, metricsMiddleware } = require('./src/middlewares/metrics.middleware');
const { trackRequest, trackError } = require('./src/middlewares/analytics.middleware');
const analyticsService = require('./src/services/analytics.service');

// Middlewares Sentry (doit être en premier)
app.use(sentryService.getRequestHandler());
app.use(sentryService.getTracingHandler());

// Middlewares de sécurité (appliqués en premier)
app.use(helmetConfig);
app.use(securityMiddleware);
app.use(sanitizeInput);

// Analytics et tracking middleware
app.use(trackRequest);

// Metrics middleware
app.use(metricsMiddleware);

// Middlewares de parsing
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ limit: MAX_FILE_SIZE, extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// Rate limiting spécialisé
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);
app.use('/api', generalLimiter);

// Routes
app.use('/api/user', userRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/meal', mealRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/garmin', garminRoutes);
app.use('/auth/garmin', garminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/legal', legalRoutes);

// Route pour la page de résultat OAuth
app.get('/auth/garmin/done', (req, res) => {
  const { status, reason, message, http_status } = req.query;
  
  // Rediriger vers le frontend avec les paramètres
  const frontendUrl = `${CORS_ORIGIN}/auth/garmin/done?status=${status || 'unknown'}${reason ? `&reason=${reason}` : ''}${message ? `&message=${message}` : ''}${http_status ? `&http_status=${http_status}` : ''}`;
  
  res.redirect(frontendUrl);
});

// Configuration Swagger/OpenAPI
const { swaggerDocs, swaggerUi } = require('./src/config/swagger.config');

// Route pour la documentation API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AVA Coach Santé - API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Base route pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API du Coach Santé Intelligent',
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    version: '1.0.0',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      documentation: '/api-docs'
    }
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware d'erreurs Sentry (doit être avant le handler d'erreurs personnalisé)
app.use(sentryService.getErrorHandler());

// Middleware analytics pour les erreurs
app.use(trackError);

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  // Log de l'erreur avec Sentry
  sentryService.captureException(err, {
    user: req.user ? {
      id: req.user.id,
      email: req.user.email
    } : null,
    extra: {
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    }
  });
  
  console.error(`❌ Erreur ${err.status || 500}:`, err.message);
  console.error(err.stack);
  
  // En mode développement, renvoyer la stack trace
  const errorResponse = {
    message: err.message || 'Une erreur est survenue',
    status: err.status || 500
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Initialisation des services IA et notifications
const { foodRecognitionService } = require('./src/services/food-recognition.service');
const notificationScheduler = require('./src/cron/notification-scheduler');
const emailService = require('./src/services/email.service');
const backupService = require('./src/services/backup.service');

// Connexion à la base de données
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ava-app';
mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB connecté');
    // Initialiser le service de reconnaissance alimentaire après connexion DB
    return foodRecognitionService.initialize();
  })
  .then(() => {
    console.log('✅ Service de reconnaissance alimentaire initialisé');
    // Initialiser le service email
    return emailService.initialize();
  })
  .then(() => {
    console.log('✅ Service email initialisé');
    // Initialiser le service analytics
    return analyticsService.initialize();
  })
  .then(() => {
    console.log('✅ Service analytics initialisé');
    // Initialiser le service de backup
    return backupService.initialize();
  })
  .then(() => {
    console.log('✅ Service de backup initialisé');
    // Démarrer le scheduler de notifications
    notificationScheduler.start();
  })
  .catch(err => {
    console.error('❌ Erreur MongoDB ou reconnaissance alimentaire:', err);
  });

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
  console.log(`🧠 TensorFlow.js: ${foodRecognitionService.isModelLoaded ? 'Activé' : 'En attente'}`);
  console.log(`🔔 Notifications: ${notificationScheduler.getStatus().isRunning ? 'Activées' : 'Désactivées'}`);
  console.log(`📧 Email: ${emailService.getStatus().isInitialized ? emailService.getStatus().provider : 'Non configuré'}`);
  console.log(`📊 Analytics: ${analyticsService.getCurrentStats().today.activeUsers} utilisateurs actifs`);
  console.log(`💾 Backup: ${backupService.getStatus().isRunning ? 'Planifié' : 'Inactif'}`);
});

module.exports = app;
