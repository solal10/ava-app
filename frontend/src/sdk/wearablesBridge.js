// 📁 wearablesBridge.js - Simulation de connexion aux données Garmin/Apple Watch
// 🎯 Ce fichier simule une connexion aux données des objets connectés de santé

const mockGarminData = {
  sleep: 7.8,
  steps: 9240,
  heartRate: 62,
  hydration: 2.3,
  stress: 3,
  energy: 82,
  timestamp: new Date().toISOString(),
};

const mockAppleHealthData = {
  sleep: 6.5,
  steps: 10420,
  heartRate: 69,
  hydration: 2.8,
  stress: 2,
  energy: 90,
  timestamp: new Date().toISOString(),
};

/**
 * Simule la récupération des données depuis Garmin Connect
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Données de santé Garmin simulées
 */
export function fetchFromGarmin(userId) {
  console.log("Simulation de récupération Garmin pour l'utilisateur:", userId);
  
  // Simulation d'un délai réseau
  return new Promise((resolve) => {
    setTimeout(() => {
      // Ajout de variations aléatoires pour rendre les données plus réalistes
      const data = {
        ...mockGarminData,
        steps: mockGarminData.steps + Math.floor(Math.random() * 1000) - 500,
        heartRate: mockGarminData.heartRate + Math.floor(Math.random() * 10) - 5,
        energy: mockGarminData.energy + Math.floor(Math.random() * 20) - 10,
        timestamp: new Date().toISOString(),
      };
      resolve(data);
    }, 800); // Délai de 800ms pour simuler l'API
  });
}

/**
 * Simule la récupération des données depuis Apple Health
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Données de santé Apple Health simulées
 */
export function fetchFromAppleHealth(userId) {
  console.log("Simulation de récupération Apple Health pour l'utilisateur:", userId);
  
  // Simulation d'un délai réseau
  return new Promise((resolve) => {
    setTimeout(() => {
      // Ajout de variations aléatoires pour rendre les données plus réalistes
      const data = {
        ...mockAppleHealthData,
        steps: mockAppleHealthData.steps + Math.floor(Math.random() * 1200) - 600,
        heartRate: mockAppleHealthData.heartRate + Math.floor(Math.random() * 8) - 4,
        energy: mockAppleHealthData.energy + Math.floor(Math.random() * 15) - 7,
        timestamp: new Date().toISOString(),
      };
      resolve(data);
    }, 600); // Délai de 600ms pour simuler l'API
  });
}

/**
 * Fonction utilitaire pour récupérer les données du device préféré de l'utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} preferredDevice - 'garmin' ou 'apple'
 * @returns {Promise<Object>} Données de santé du device préféré
 */
export function fetchFromPreferredDevice(userId, preferredDevice = 'garmin') {
  console.log(`Récupération des données depuis le device préféré: ${preferredDevice}`);
  
  switch (preferredDevice.toLowerCase()) {
    case 'apple':
    case 'applehealth':
      return fetchFromAppleHealth(userId);
    case 'garmin':
    default:
      return fetchFromGarmin(userId);
  }
}

/**
 * Fonction pour synchroniser les données de tous les devices connectés
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Données consolidées de tous les devices
 */
export async function syncAllDevices(userId) {
  console.log("Synchronisation de tous les devices connectés...");
  
  try {
    const [garminData, appleData] = await Promise.all([
      fetchFromGarmin(userId),
      fetchFromAppleHealth(userId)
    ]);
    
    // Consolidation des données (moyenne ou valeur la plus récente)
    const consolidatedData = {
      sleep: Math.round(((garminData.sleep + appleData.sleep) / 2) * 10) / 10,
      steps: Math.max(garminData.steps, appleData.steps), // On prend le maximum
      heartRate: Math.round((garminData.heartRate + appleData.heartRate) / 2),
      hydration: Math.round(((garminData.hydration + appleData.hydration) / 2) * 10) / 10,
      stress: Math.round((garminData.stress + appleData.stress) / 2),
      energy: Math.round((garminData.energy + appleData.energy) / 2),
      timestamp: new Date().toISOString(),
      sources: ['garmin', 'apple']
    };
    
    console.log("Données consolidées:", consolidatedData);
    return consolidatedData;
    
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error);
    throw new Error("Impossible de synchroniser les données des devices");
  }
}
