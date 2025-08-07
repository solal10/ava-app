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

// Configuration
const app = express();
const PORT = process.env.PORT || 5003;

// Middlewares
app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les images base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/meal', mealRoutes);
app.use('/api/learn', learnRoutes);

// Base route pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API du Coach Santé Intelligent' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur est survenue', error: err.message });
});

// Connexion à la base de données
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});

module.exports = app;
