require('dotenv').config();
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

// Configuration
const app = express();
const PORT = process.env.PORT || 5003;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '50mb';

// Import des middlewares
const { rateLimit } = require('./src/middlewares/auth.middleware');

// Middlewares
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ limit: MAX_FILE_SIZE, extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// Rate limiting ajusté pour développement
app.use('/api/user/login', rateLimit(50, 15 * 60 * 1000)); // 50 tentatives par 15min (dev)
app.use('/api/user/register', rateLimit(20, 60 * 60 * 1000)); // 20 inscriptions par heure (dev)
app.use('/api', rateLimit(1000, 15 * 60 * 1000)); // 1000 requêtes par 15min (dev)

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

// Route pour la page de résultat OAuth
app.get('/auth/garmin/done', (req, res) => {
  const { status, reason, message, http_status } = req.query;
  
  // Rediriger vers le frontend avec les paramètres
  const frontendUrl = `${CORS_ORIGIN}/auth/garmin/done?status=${status || 'unknown'}${reason ? `&reason=${reason}` : ''}${message ? `&message=${message}` : ''}${http_status ? `&http_status=${http_status}` : ''}`;
  
  res.redirect(frontendUrl);
});

// Base route pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API du Coach Santé Intelligent' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
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

// Connexion à la base de données
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ava-app';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});

module.exports = app;
