/**
 * Utilitaire pour gérer les accès aux fonctionnalités selon le niveau d'abonnement
 */

// Définition des niveaux d'abonnement par ordre croissant
const SUBSCRIPTION_LEVELS = ['explore', 'perform', 'pro', 'elite'];

// Mapping des fonctionnalités avec le niveau minimum requis
const FEATURE_REQUIREMENTS = {
  // Données d'état
  'body-battery': 'explore',
  'sleep-score': 'explore',
  'hr-resting': 'perform',
  'stress-level': 'pro',
  'nutrition-score': 'elite',
  
  // Fonctionnalités du coach IA
  'ia-chat': 'explore',
  'ia-unlimited': 'perform',
  'ia-detailed-analysis': 'pro',
  'ia-personalized-plan': 'elite',
  
  // Programmes
  'basic-programs': 'explore',
  'custom-programs': 'perform',
  'advanced-programs': 'pro',
  'personal-coaching': 'elite',
  
  // Autres fonctionnalités
  'export-data': 'perform',
  'integration-apps': 'pro',
  'api-access': 'elite'
};

/**
 * Vérifie si un utilisateur a accès à une fonctionnalité selon son niveau d'abonnement
 * @param {string} feature - Identifiant de la fonctionnalité
 * @param {string} userLevel - Niveau d'abonnement de l'utilisateur
 * @returns {boolean} - True si l'utilisateur a accès, false sinon
 */
export const canAccess = (feature, userLevel) => {
  // Si la fonctionnalité n'existe pas dans le mapping, on considère qu'elle n'est pas restreinte
  if (!FEATURE_REQUIREMENTS[feature]) return true;
  
  const requiredLevel = FEATURE_REQUIREMENTS[feature];
  const userLevelIndex = SUBSCRIPTION_LEVELS.indexOf(userLevel);
  const requiredLevelIndex = SUBSCRIPTION_LEVELS.indexOf(requiredLevel);
  
  // Vérifier si le niveau de l'utilisateur est supérieur ou égal au niveau requis
  return userLevelIndex >= requiredLevelIndex;
};

/**
 * Retourne le nom du niveau d'abonnement nécessaire pour accéder à une fonctionnalité
 * @param {string} feature - Identifiant de la fonctionnalité
 * @returns {string|null} - Nom du niveau d'abonnement ou null si non restreint
 */
export const getRequiredLevel = (feature) => {
  return FEATURE_REQUIREMENTS[feature] || null;
};

/**
 * Retourne un message d'incitation à l'upgrade adapté au contexte
 * @param {string} feature - Identifiant de la fonctionnalité
 * @returns {string} - Message d'incitation à l'upgrade
 */
export const getUpgradeMessage = (feature) => {
  const requiredLevel = getRequiredLevel(feature);
  
  if (!requiredLevel || requiredLevel === 'explore') {
    return "Connectez-vous pour accéder à cette fonctionnalité";
  }
  
  const featureNames = {
    'hr-resting': 'la fréquence cardiaque au repos',
    'stress-level': 'l\'analyse de stress',
    'nutrition-score': 'le score nutritionnel',
    'ia-unlimited': 'des questions illimitées à l\'IA',
    'ia-detailed-analysis': 'l\'analyse détaillée de l\'IA',
    'ia-personalized-plan': 'un plan personnalisé de l\'IA'
  };
  
  const featureName = featureNames[feature] || 'cette fonctionnalité';
  
  return `Passez à l'abonnement ${requiredLevel.charAt(0).toUpperCase() + requiredLevel.slice(1)} pour accéder à ${featureName}`;
};

/**
 * Retourne le nombre de requêtes IA autorisées par semaine selon le niveau d'abonnement
 * @param {string} subscriptionLevel - Niveau d'abonnement
 * @returns {number|null} - Nombre de requêtes ou null si illimité
 */
export const getWeeklyIARequestLimit = (subscriptionLevel) => {
  const limits = {
    'explore': 3,
    'perform': null, // illimité
    'pro': null,
    'elite': null
  };
  
  return limits[subscriptionLevel];
};

/**
 * Retourne une liste de fonctionnalités disponibles pour un niveau d'abonnement
 * @param {string} subscriptionLevel - Niveau d'abonnement
 * @returns {string[]} - Liste des identifiants de fonctionnalités
 */
export const getAvailableFeatures = (subscriptionLevel) => {
  const userLevelIndex = SUBSCRIPTION_LEVELS.indexOf(subscriptionLevel);
  
  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([_, level]) => {
      const requiredLevelIndex = SUBSCRIPTION_LEVELS.indexOf(level);
      return userLevelIndex >= requiredLevelIndex;
    })
    .map(([feature, _]) => feature);
};
