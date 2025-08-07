/**
 * API pour la gestion des données de santé
 */

/**
 * Récupère les données de santé d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} - Historique des données de santé
 */
export const getHealth = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5003/api/health/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.healthData;
  } catch (error) {
    console.error('Erreur lors de la récupération des données de santé:', error);
    
    // Fallback: récupérer depuis localStorage ou données simulées
    const localHealth = localStorage.getItem(`health_${userId}`);
    if (localHealth) {
      return JSON.parse(localHealth);
    }
    
    // Données simulées par défaut
    const now = new Date();
    const simulatedData = [];
    
    // Générer 7 jours de données simulées
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      simulatedData.push({
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
    
    return simulatedData;
  }
};

/**
 * Récupère les dernières données de santé d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Dernières données de santé
 */
export const getLatestHealth = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5003/api/health/${userId}/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.healthData;
  } catch (error) {
    console.error('Erreur lors de la récupération des dernières données de santé:', error);
    
    // Fallback: récupérer depuis localStorage ou données simulées
    const localHealth = localStorage.getItem(`health_${userId}`);
    if (localHealth) {
      const healthData = JSON.parse(localHealth);
      return healthData.length > 0 ? healthData[0] : null;
    }
    
    // Données simulées par défaut (données du jour)
    return {
      date: new Date().toISOString().split('T')[0],
      weight: 70,
      steps: 9500,
      calories: 2100,
      sleep: 7.5,
      stress: 2,
      mood: 4,
      hydration: 2.2
    };
  }
};

/**
 * Ajoute de nouvelles données de santé pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} data - Données de santé à ajouter
 * @returns {Promise<Object>} - Données de santé ajoutées
 */
export const addHealth = async (userId, data) => {
  try {
    const response = await fetch(`http://localhost:5003/api/health/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Sauvegarder en local également pour fallback
    try {
      const localHealth = localStorage.getItem(`health_${userId}`);
      const healthData = localHealth ? JSON.parse(localHealth) : [];
      healthData.unshift(responseData.healthData); // Ajouter au début du tableau
      localStorage.setItem(`health_${userId}`, JSON.stringify(healthData));
    } catch (storageError) {
      console.error('Erreur lors de la sauvegarde locale des données de santé:', storageError);
    }
    
    return responseData.healthData;
  } catch (error) {
    console.error('Erreur lors de l\'ajout des données de santé:', error);
    throw error;
  }
};

export default {
  getHealth,
  getLatestHealth,
  addHealth
};
