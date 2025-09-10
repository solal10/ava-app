import axios from 'axios';

// Création de l'instance axios avec URL de base
const api = axios.create({
  baseURL: 'http://localhost:5003/api'
});

// Intercepteur pour ajouter le token JWT à toutes les requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si erreur 401 (non autorisé), rediriger vers la page d'authentification
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// API des abonnements
export const subscriptionAPI = {
  // Récupérer le statut d'abonnement de l'utilisateur
  getUserSubscription: async () => {
    try {
      const response = await api.get('/subscription/status');
      return response.data;
    } catch (error) {
      // Fallback en cas d'erreur (considérer comme non-premium)
      console.error('Erreur lors de la récupération du statut d\'abonnement:', error);
      return { isPremium: false };
    }
  },

  // Simuler une mise à niveau vers premium (pour démo uniquement)
  upgradeToPremium: async () => {
    try {
      const response = await api.post('/subscription/upgrade');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à niveau de l\'abonnement:', error);
      throw error.response?.data || { message: "Erreur lors de la mise à niveau de l'abonnement" };
    }
  }
};

export default subscriptionAPI;
