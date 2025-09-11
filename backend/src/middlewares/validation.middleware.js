const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const validator = require('validator');

// Configuration XSS stricte pour les données de santé
const xssOptions = {
  whiteList: {}, // Aucune balise HTML autorisée
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
};

// Middleware pour nettoyer les données contre XSS
exports.sanitizeInput = (req, res, next) => {
  // Nettoyer le body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Nettoyer les query parameters  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Nettoyer les params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Fonction récursive pour nettoyer les objets
function sanitizeObject(obj) {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return xss(obj, xssOptions);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Validation des IDs MongoDB
exports.validateMongoId = [
  param('id')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('ID invalide')
];

// Validation des données d'inscription
exports.validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule et un chiffre'),
  body('prenom')
    .optional()
    .isLength({ min: 2, max: 50 })
    .trim()
    .escape()
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
];

// Validation des données de connexion
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email invalide'),
  body('password')
    .exists()
    .isLength({ min: 1, max: 128 })
    .withMessage('Mot de passe requis')
];

// Validation des données santé
exports.validateHealthData = [
  body('sommeil')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le score de sommeil doit être entre 0 et 100'),
  body('stress')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le score de stress doit être entre 0 et 100'),
  body('hydratation')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le score d\'hydratation doit être entre 0 et 100'),
  body('energie')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le score d\'énergie doit être entre 0 et 100'),
  body('activite')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le score d\'activité doit être entre 0 et 100'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Format de date invalide (ISO8601 requis)')
];

// Validation des données de repas
exports.validateMealData = [
  body('nom')
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .trim()
    .withMessage('Le nom du repas est requis (1-200 caractères)'),
  body('calories')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Les calories doivent être entre 0 et 10000'),
  body('proteines')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Les protéines doivent être entre 0 et 1000g'),
  body('glucides')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Les glucides doivent être entre 0 et 1000g'),
  body('lipides')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Les lipides doivent être entre 0 et 1000g'),
  body('type')
    .optional()
    .isIn(['petit-dejeuner', 'dejeuner', 'diner', 'collation'])
    .withMessage('Type de repas invalide'),
  body('image')
    .optional()
    .isLength({ max: 50000000 }) // 50MB max
    .withMessage('Image trop volumineuse (50MB max)')
];

// Validation des données d'exercice
exports.validateWorkoutData = [
  body('nom')
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .trim()
    .withMessage('Le nom de l\'exercice est requis'),
  body('duree')
    .optional()
    .isInt({ min: 1, max: 1440 }) // max 24h
    .withMessage('La durée doit être entre 1 et 1440 minutes'),
  body('calories')
    .optional()
    .isFloat({ min: 0, max: 5000 })
    .withMessage('Les calories doivent être entre 0 et 5000'),
  body('intensite')
    .optional()
    .isIn(['faible', 'moderee', 'elevee', 'tres_elevee'])
    .withMessage('Intensité invalide'),
  body('type')
    .optional()
    .isIn(['cardio', 'musculation', 'yoga', 'pilates', 'course', 'velo', 'natation', 'autre'])
    .withMessage('Type d\'exercice invalide')
];

// Validation des paramètres de pagination
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Numéro de page invalide (1-1000)'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)')
];

// Validation des données de profil utilisateur
exports.validateUserProfile = [
  body('prenom')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Le prénom doit contenir entre 1 et 50 caractères'),
  body('nom')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Le nom doit contenir entre 1 et 50 caractères'),
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('L\'âge doit être entre 13 et 120 ans'),
  body('poids')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Le poids doit être entre 20 et 500 kg'),
  body('taille')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('La taille doit être entre 50 et 300 cm'),
  body('objectif')
    .optional()
    .isIn(['perte_poids', 'prise_masse', 'maintien', 'endurance', 'force'])
    .withMessage('Objectif invalide')
];

// Middleware pour vérifier les erreurs de validation
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Données invalides',
      errors: errors.array()
    });
  }
  next();
};