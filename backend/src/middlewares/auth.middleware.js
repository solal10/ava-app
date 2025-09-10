const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const securityUtils = require('../utils/security.utils');

// Obtenir le secret JWT sécurisé
const JWT_SECRET = securityUtils.getJWTSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validation du secret au démarrage
const secretValidation = securityUtils.validateJWTSecret(JWT_SECRET);
if (!secretValidation.valid) {
  console.error('🚨 SÉCURITÉ COMPROMISE: Secret JWT non sécurisé -', secretValidation.reason);
  console.error('⚠️  Utilisez un secret généré cryptographiquement ou laissez le système en générer un');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Secret JWT non sécurisé en production: ' + secretValidation.reason);
  }
} else {
  console.log('✅ Secret JWT validé et sécurisé');
}

// Rate limiting simple en mémoire (pour production, utiliser Redis)
const rateLimitStore = new Map();

// Middleware de rate limiting
exports.rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitStore.has(clientIP)) {
      rateLimitStore.set(clientIP, []);
    }
    
    const requests = rateLimitStore.get(clientIP);
    // Nettoyer les anciennes requêtes
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        message: 'Trop de requêtes, veuillez réessayer plus tard',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    recentRequests.push(now);
    rateLimitStore.set(clientIP, recentRequests);
    
    next();
  };
};

// Middleware d'authentification amélioré
exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Accès non autorisé - Token manquant ou format incorrect' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé - Token manquant' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    req.userId = decoded.userId;
    req.user = user;
    req.subscriptionLevel = decoded.subscriptionLevel || user.subscriptionLevel;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token invalide',
        code: 'TOKEN_INVALID'
      });
    }
    
    console.error('Erreur auth middleware:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

// Middleware pour vérifier le niveau d'abonnement
exports.requireSubscription = (minLevel) => {
  const levels = { explore: 0, perform: 1, pro: 2, elite: 3 };
  
  return (req, res, next) => {
    const userLevel = levels[req.subscriptionLevel] || 0;
    const requiredLevel = levels[minLevel] || 0;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({
        message: 'Abonnement insuffisant pour accéder à cette fonctionnalité',
        required: minLevel,
        current: req.subscriptionLevel
      });
    }
    
    next();
  };
};

// Utilitaire pour générer des tokens
exports.generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      subscriptionLevel: user.subscriptionLevel
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};
