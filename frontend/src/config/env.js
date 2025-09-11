// Configuration d'environnement pour le frontend
const config = {
  // API Backend
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5003',
  
  // Informations de l'application
  APP_NAME: import.meta.env.VITE_APP_NAME || 'AVA Coach Santé IA',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Mode de développement
  isDevelopment: () => import.meta.env.MODE === 'development',
  isProduction: () => import.meta.env.MODE === 'production',
  
  // Méthode pour obtenir l'endpoint API complet
  getAPIEndpoint: (path) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5003';
    return `${baseURL}${path}`;
  },
  
  // Configuration des fonctionnalités
  features: {
    garminIntegration: import.meta.env.VITE_FEATURE_GARMIN_INTEGRATION === 'true',
    aiFoodRecognition: import.meta.env.VITE_FEATURE_AI_FOOD_RECOGNITION === 'true',
    advancedAnalytics: import.meta.env.VITE_FEATURE_ADVANCED_ANALYTICS === 'true'
  },
  
  // Configuration Garmin OAuth
  garmin: {
    redirectUri: import.meta.env.VITE_GARMIN_REDIRECT_URI || 'http://localhost:5173/auth/garmin/callback',
    authEndpoint: import.meta.env.VITE_GARMIN_AUTH_ENDPOINT || '/api/garmin/auth',
    tokenEndpoint: import.meta.env.VITE_GARMIN_TOKEN_ENDPOINT || '/api/garmin/token'
  },
  
  // Limites et timeouts
  limits: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    requestTimeout: 30000, // 30 secondes
    garminSyncInterval: 5 * 60 * 1000 // 5 minutes
  }
};

export default config;
