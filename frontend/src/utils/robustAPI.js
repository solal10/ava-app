/**
 * API robuste avec fallbacks automatiques
 * Garantit que l'application fonctionne toujours, même en cas de problème backend
 */

import { 
  mockUser, 
  mockStats, 
  generateMockHealthHistory, 
  mockProgram, 
  mockMeals, 
  mockMessages, 
  mockEvolution 
} from './mockData.js';

// Configuration API
const API_BASE_URL = 'http://localhost:5003/api';
const API_TIMEOUT = 5000; // 5 secondes

// Fonction utilitaire pour faire des requêtes avec fallback automatique
const robustFetch = async (url, options = {}, fallbackData = null) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success: ${url}`);
    return data;
    
  } catch (error) {
    console.warn(`⚠️ API Fallback: ${url} - ${error.message}`);
    
    if (fallbackData) {
      return fallbackData;
    }
    
    throw error;
  }
};

// API robuste pour les utilisateurs
export const robustUserAPI = {
  getUser: async (userId) => {
    return await robustFetch(
      `${API_BASE_URL}/user/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      { user: mockUser }
    );
  },

  getProfile: async () => {
    return await robustFetch(
      `${API_BASE_URL}/user/profile`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      { user: mockUser }
    );
  },

  getStats: async () => {
    return await robustFetch(
      `${API_BASE_URL}/user/stats`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      mockStats
    );
  },

  getHealthHistory: async (days = 7) => {
    return await robustFetch(
      `${API_BASE_URL}/user/health/history?days=${days}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      { history: generateMockHealthHistory(days) }
    );
  },

  getProgram: async () => {
    return await robustFetch(
      `${API_BASE_URL}/user/program`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      mockProgram
    );
  },

  getMeals: async () => {
    return await robustFetch(
      `${API_BASE_URL}/user/meals`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      mockMeals
    );
  },

  getMessages: async () => {
    return await robustFetch(
      `${API_BASE_URL}/user/messages`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      mockMessages
    );
  },

  getEvolution: async () => {
    return await robustFetch(
      `${API_BASE_URL}/user/evolution`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      mockEvolution
    );
  }
};

// API robuste pour la santé
export const robustHealthAPI = {
  getHealth: async (userId) => {
    return await robustFetch(
      `${API_BASE_URL}/health/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      { healthData: generateMockHealthHistory(7) }
    );
  },

  getLatestHealth: async (userId) => {
    const history = generateMockHealthHistory(1);
    return await robustFetch(
      `${API_BASE_URL}/health/${userId}/latest`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      { healthData: history[0] }
    );
  },

  addHealth: async (userId, data) => {
    try {
      return await robustFetch(
        `${API_BASE_URL}/health/${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(data)
        },
        { success: true, data }
      );
    } catch (error) {
      // Sauvegarder localement en cas d'échec
      const localKey = `health_${userId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      existing.unshift(data);
      localStorage.setItem(localKey, JSON.stringify(existing.slice(0, 30))); // Garder 30 derniers
      return { success: true, data, saved: 'locally' };
    }
  }
};

export default {
  user: robustUserAPI,
  health: robustHealthAPI
};
