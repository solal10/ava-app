const { body, validationResult } = require('express-validator');

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
    .withMessage('Email invalide'),
  body('password')
    .exists()
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
    .withMessage('Le score d\'activité doit être entre 0 et 100')
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