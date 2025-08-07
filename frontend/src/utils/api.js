import axios from 'axios';

// Création d'une instance axios avec une configuration de base
const api = axios.create({
  baseURL: 'http://localhost:5003/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
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

// Intercepteur pour gérer les erreurs de réponse, notamment les 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si erreur 401 (non autorisé) : token expiré ou invalide
    if (error.response && error.response.status === 401) {
      console.error('Session expirée ou non autorisée');
      // Supprimer le token du localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Rediriger vers la page d'authentification
      window.location.href = '/auth';
      
      return Promise.reject({ message: 'Session expirée. Veuillez vous reconnecter.' });
    }
    return Promise.reject(error);
  }
);

// API d'authentification
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post('/user/login', { email, password });
      // Stocker le token JWT dans localStorage
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la connexion" };
    }
  },
  
  testLogin: async (subscriptionLevel) => {
    try {
      // Version modifiée : ne fait pas d'appel au backend, crée directement un utilisateur et token local
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2MzIxNTQxNjJ9.8h5TbQB0_xnJn8mAIBIm1UC_uqLvY4JUYg9nNGPB38c";
      
      // Utilisateur fictif
      const mockUser = {
        id: "1234567890",
        name: "Utilisateur Test",
        email: "test@test.com",
        isPremium: subscriptionLevel === 'perform',
        stats: {
          sommeil: 7,
          hydratation: 1.5,
          stress: 5,
          activite: 45,
          energie: 6
        }
      };
      
      // Stocker le token JWT et les infos utilisateur
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      return { token: mockToken, user: mockUser };
    } catch (error) {
      throw { message: 'Erreur de connexion test' };
    }
  },
  
  logout: async () => {
    try {
      // Supprimer le token du localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la déconnexion" };
    }
  },
};

// API des données utilisateur
export const userAPI = {
  getStats: async () => {
    try {
      const response = await api.get('/user/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur API stats, utilisation des données simulées:', error);
      // Retourner des données simulées au lieu de lancer une erreur
      return {
        metrics: {
          weight: 70,
          steps: 9500,
          calories: 2100,
          sleep: 7.5,
          stress: 2,
          mood: 4,
          hydration: 2.2
        },
        goals: {
          weight: 68,
          steps: 10000,
          calories: 2000,
          sleep: 8,
          stress: 1,
          hydration: 2.5
        },
        progress: {
          weight: 95,
          steps: 95,
          calories: 105,
          sleep: 94,
          stress: 50,
          hydration: 88
        }
      };
    }
  },
  
  updateStats: async (statsData) => {
    try {
      const response = await api.post('/user/stats/update', statsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la mise à jour des statistiques" };
    }
  },
  
  getProgram: async () => {
    try {
      const response = await api.get('/user/program');
      return response.data;
    } catch (error) {
      console.error('Erreur API programme, utilisation des données simulées:', error);
      // Retourner un programme simulé
      return {
        program: {
          name: "Programme Équilibré",
          duration: "4 semaines",
          exercises: [
            { name: "Marche rapide", duration: "30 min", frequency: "5x/semaine" },
            { name: "Exercices de force", duration: "20 min", frequency: "3x/semaine" },
            { name: "Étirements", duration: "10 min", frequency: "Quotidien" }
          ],
          nutrition: {
            calories: 2000,
            protein: "25%",
            carbs: "45%",
            fat: "30%"
          }
        }
      };
    }
  },
  
  getHealthHistory: async (days = 7) => {
    try {
      const response = await api.get(`/user/health/history?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erreur API historique santé, utilisation des données simulées:', error);
      // Générer des données simulées pour l'historique
      const now = new Date();
      const history = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        history.push({
          date: date.toISOString().split('T')[0],
          weight: 70 + (Math.random() - 0.5) * 2,
          steps: 8000 + Math.floor(Math.random() * 4000),
          calories: 1800 + Math.floor(Math.random() * 400),
          sleep: 7 + Math.random() * 2,
          stress: Math.floor(Math.random() * 5) + 1,
          mood: Math.floor(Math.random() * 5) + 1,
          hydration: 1.5 + Math.random() * 1.5
        });
      }
      
      return { history };
    }
  },
  
  getMeals: async () => {
    try {
      const response = await api.get('/user/meals');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la récupération des repas" };
    }
  },
  
  getMessages: async () => {
    try {
      const response = await api.get('/user/messages');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la récupération des messages" };
    }
  },
  
  getEvolution: async () => {
    try {
      const response = await api.get('/user/evolution');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la récupération de l'évolution" };
    }
  },
};

// API de chat avec l'IA
export const chatAPI = {
  sendMessage: async (message) => {
    try {
      const response = await api.post('/ia/ask', { question: message });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de l'envoi du message à l'IA" };
    }
  },
  
  getRequestCount: async () => {
    try {
      const response = await api.get('/ia/request-count');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la récupération du compteur de requêtes" };
    }
  }
};

// API d'abonnement
export const subscriptionAPI = {
  getCurrentSubscription: async () => {
    try {
      const response = await api.get('/subscription');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la récupération de l'abonnement" };
    }
  },
  
  updateSubscription: async (newLevel) => {
    try {
      const response = await api.post('/subscription/update', { level: newLevel });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la mise à jour de l'abonnement" };
    }
  },
};

export default api;
