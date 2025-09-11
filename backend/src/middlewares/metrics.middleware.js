const promClient = require('prom-client');

const collectDefaultMetrics = promClient.collectDefaultMetrics;
const register = promClient.register;

collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations'
});

const userLogins = new promClient.Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins'
});

const healthMetrics = new promClient.Counter({
  name: 'health_data_points_total',
  help: 'Total number of health data points recorded',
  labelNames: ['type']
});

const mealAnalyses = new promClient.Counter({
  name: 'meal_analyses_total',
  help: 'Total number of meal analyses performed'
});

const aiChatMessages = new promClient.Counter({
  name: 'ai_chat_messages_total',
  help: 'Total number of AI chat messages',
  labelNames: ['provider']
});

const subscriptionEvents = new promClient.Counter({
  name: 'subscription_events_total',
  help: 'Total number of subscription events',
  labelNames: ['event_type', 'tier']
});

const emailsSent = new promClient.Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['provider', 'type', 'status']
});

const garminSyncs = new promClient.Counter({
  name: 'garmin_syncs_total',
  help: 'Total number of Garmin data syncs',
  labelNames: ['status']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseConnections);
register.registerMetric(userRegistrations);
register.registerMetric(userLogins);
register.registerMetric(healthMetrics);
register.registerMetric(mealAnalyses);
register.registerMetric(aiChatMessages);
register.registerMetric(subscriptionEvents);
register.registerMetric(emailsSent);
register.registerMetric(garminSyncs);

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  activeConnections.inc();

  const originalSend = res.send;
  res.send = function(body) {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    activeConnections.dec();
    
    return originalSend.call(this, body);
  };

  next();
};

const trackUserRegistration = () => {
  userRegistrations.inc();
};

const trackUserLogin = () => {
  userLogins.inc();
};

const trackHealthData = (type) => {
  healthMetrics.labels(type).inc();
};

const trackMealAnalysis = () => {
  mealAnalyses.inc();
};

const trackAiChatMessage = (provider) => {
  aiChatMessages.labels(provider).inc();
};

const trackSubscriptionEvent = (eventType, tier) => {
  subscriptionEvents.labels(eventType, tier).inc();
};

const trackEmailSent = (provider, type, status) => {
  emailsSent.labels(provider, type, status).inc();
};

const trackGarminSync = (status) => {
  garminSyncs.labels(status).inc();
};

const updateDatabaseConnections = (count) => {
  databaseConnections.set(count);
};

module.exports = {
  register,
  metricsMiddleware,
  trackUserRegistration,
  trackUserLogin,
  trackHealthData,
  trackMealAnalysis,
  trackAiChatMessage,
  trackSubscriptionEvent,
  trackEmailSent,
  trackGarminSync,
  updateDatabaseConnections
};