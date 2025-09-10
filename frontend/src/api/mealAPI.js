import axios from 'axios';

// Configuration de l'API
const API_BASE_URL = 'http://localhost:5003/api/meal';

// Instance axios pour les requêtes meal
const mealAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes pour l'analyse d'image
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour ajouter le token d'authentification
mealAPI.interceptors.request.use(
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
mealAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erreur API Meal:', error);
    
    if (error.response) {
      // Erreur avec réponse du serveur
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          throw new Error(data.error || 'Données invalides');
        case 422:
          throw new Error(data.error || 'Aucun aliment détecté dans cette image');
        case 500:
          throw new Error('Erreur interne du serveur d\'analyse');
        default:
          throw new Error(data.error || 'Erreur lors de l\'analyse');
      }
    } else if (error.request) {
      // Erreur réseau
      throw new Error('Impossible de contacter le serveur d\'analyse. Vérifiez votre connexion.');
    } else {
      // Autre erreur
      throw new Error('Erreur inattendue lors de l\'analyse');
    }
  }
);

/**
 * Convertit un fichier en base64
 * @param {File} file - Fichier image à convertir
 * @returns {Promise<string>} - Image en base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Analyse une image de repas et retourne les aliments détectés
 * @param {File|string} image - Fichier image ou string base64
 * @returns {Promise<Object>} - Résultats de l'analyse
 */
export const analyzeImage = async (image) => {
  try {
    let imageBase64;
    
    // Convertir le fichier en base64 si nécessaire
    if (image instanceof File) {
      imageBase64 = await fileToBase64(image);
    } else if (typeof image === 'string') {
      imageBase64 = image;
    } else {
      throw new Error('Format d\'image non supporté');
    }
    
    console.log('Envoi de l\'image pour analyse...');
    
    // Envoyer la requête d'analyse
    const response = await mealAPI.post('/analyze', {
      imageBase64: imageBase64
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Échec de l\'analyse');
    }
    
    return response.data.data;
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse d\'image:', error);
    throw error;
  }
};

/**
 * Vérifie l'état du service d'analyse
 * @returns {Promise<Object>} - État du service
 */
export const checkServiceHealth = async () => {
  try {
    const response = await mealAPI.get('/health');
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la vérification du service:', error);
    throw error;
  }
};

/**
 * Récupère la liste des labels alimentaires supportés
 * @returns {Promise<Array>} - Liste des labels
 */
export const getFoodLabels = async () => {
  try {
    const response = await mealAPI.get('/labels');
    return response.data.data.labels;
  } catch (error) {
    console.error('Erreur lors de la récupération des labels:', error);
    throw error;
  }
};

/**
 * Trouve les données nutritionnelles CIQUAL pour un aliment
 * @param {string} foodName - Nom de l'aliment
 * @param {Array} ciqualData - Base de données CIQUAL
 * @returns {Object|null} - Données nutritionnelles ou null si non trouvé
 */
export const findNutritionalData = (foodName, ciqualData) => {
  if (!foodName || !ciqualData) return null;
  
  // Recherche exacte
  let found = ciqualData.find(item => 
    item.nom.toLowerCase() === foodName.toLowerCase()
  );
  
  if (found) return found;
  
  // Recherche partielle
  found = ciqualData.find(item => 
    item.nom.toLowerCase().includes(foodName.toLowerCase()) ||
    foodName.toLowerCase().includes(item.nom.toLowerCase())
  );
  
  if (found) return found;
  
  // Recherche par mots-clés
  const foodWords = foodName.toLowerCase().split(' ');
  found = ciqualData.find(item => {
    const itemWords = item.nom.toLowerCase().split(' ');
    return foodWords.some(word => 
      itemWords.some(itemWord => 
        itemWord.includes(word) || word.includes(itemWord)
      )
    );
  });
  
  return found || null;
};

/**
 * Combine les résultats de classification avec les données nutritionnelles CIQUAL
 * @param {Array} detectedFoods - Aliments détectés par l'IA
 * @param {Array} ciqualData - Base de données CIQUAL
 * @returns {Array} - Aliments avec données nutritionnelles
 */
export const combineWithNutritionalData = (detectedFoods, ciqualData) => {
  return detectedFoods.map(food => {
    const nutritionalData = findNutritionalData(food.label, ciqualData);
    
    return {
      ...food,
      nutritionalData: nutritionalData || {
        nom: food.label,
        calories: 0,
        proteines: 0,
        lipides: 0,
        glucides: 0,
        fibres: 0,
        sucres: 0
      },
      hasNutritionalData: !!nutritionalData
    };
  });
};

/**
 * Récupère tous les repas d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} - Liste des repas
 */
export const getMeals = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5003/api/meal/${userId}`, {
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
    return data.meals;
  } catch (error) {
    console.error('Erreur lors de la récupération des repas:', error);
    
    // Fallback: récupérer depuis localStorage
    const localMeals = localStorage.getItem(`meals_${userId}`);
    return localMeals ? JSON.parse(localMeals) : [];
  }
};

/**
 * Ajoute un nouveau repas pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} meal - Données du repas
 * @returns {Promise<Object>} - Repas ajouté
 */
export const addMeal = async (userId, meal) => {
  try {
    const response = await fetch(`http://localhost:5003/api/meal/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(meal)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // Sauvegarder en local également pour fallback
    try {
      const localMeals = localStorage.getItem(`meals_${userId}`);
      const meals = localMeals ? JSON.parse(localMeals) : [];
      meals.push(data.meal);
      localStorage.setItem(`meals_${userId}`, JSON.stringify(meals));
    } catch (storageError) {
      console.error('Erreur lors de la sauvegarde locale du repas:', storageError);
    }
    
    return data.meal;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du repas:', error);
    throw error;
  }
};

export default {
  analyzeImage,
  checkServiceHealth,
  getFoodLabels,
  findNutritionalData,
  combineWithNutritionalData,
  getMeals,
  addMeal
};
