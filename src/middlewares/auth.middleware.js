const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-only';

exports.authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé - Token manquant' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.subscriptionLevel = decoded.subscriptionLevel;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Accès non autorisé - Token invalide' });
  }
};
