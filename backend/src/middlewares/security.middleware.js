const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Configuration Helmet pour la sécurité des en-têtes
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.spoonacular.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Nécessaire pour les uploads d'images
});

// Rate limiting pour les endpoints sensibles
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: {
    error: 'Trop de tentatives de connexion',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting général
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour les endpoints d'API externes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requêtes par minute pour les APIs externes
  message: {
    error: 'Limite de requêtes API atteinte',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de détection d'attaques
const securityMiddleware = (req, res, next) => {
  // Détecter les tentatives d'injection
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /(union|select|insert|update|delete|drop|create|alter)\s+/gi,
    /'(\s*(union|select|insert|update|delete|drop|create|alter)\s+|.*'(\s*or\s*|\s*and\s*).*)/gi
  ];

  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn('🚨 Tentative d\'attaque détectée:', {
        ip: req.ip,
        pattern: pattern.source,
        data: checkString.substring(0, 100)
      });
      
      return res.status(400).json({
        error: 'Requête invalide détectée',
        code: 'SECURITY_VIOLATION'
      });
    }
  }

  // Vérifier la taille des données
  const bodySize = JSON.stringify(req.body).length;
  if (bodySize > 50 * 1024 * 1024) { // 50MB max
    return res.status(413).json({
      error: 'Données trop volumineuses',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  next();
};

module.exports = {
  helmetConfig,
  authLimiter,
  generalLimiter,
  apiLimiter,
  securityMiddleware
};