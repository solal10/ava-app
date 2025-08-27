const User = require('../../models/user.model');

// Récupérer les informations d'abonnement de l'utilisateur
exports.getCurrentSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('subscriptionLevel');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    return res.status(200).json({
      subscriptionLevel: user.subscriptionLevel,
      features: getFeaturesByLevel(user.subscriptionLevel),
      nextRenewalDate: getNextRenewalDate()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération de l\'abonnement', error: error.message });
  }
};

// Mettre à jour le niveau d'abonnement
exports.updateSubscription = async (req, res) => {
  try {
    const { level } = req.body;

    // Vérifier si le niveau est valide
    if (!['explore', 'perform', 'pro', 'elite'].includes(level)) {
      return res.status(400).json({ message: 'Niveau d\'abonnement invalide' });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour le niveau d'abonnement
    user.subscriptionLevel = level;
    await user.save();

    return res.status(200).json({
      message: 'Abonnement mis à jour avec succès',
      subscriptionLevel: user.subscriptionLevel,
      features: getFeaturesByLevel(user.subscriptionLevel),
      nextRenewalDate: getNextRenewalDate()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'abonnement', error: error.message });
  }
};

// Fonction utilitaire pour obtenir les fonctionnalités par niveau d'abonnement
function getFeaturesByLevel(level) {
  const baseFeatures = ['Profil de santé basique', 'Chat IA (3 questions/jour)'];
  
  if (level === 'explore') {
    return baseFeatures;
  }
  
  if (level === 'perform') {
    return [
      ...baseFeatures,
      'Données cardiaques',
      'Chat IA illimité',
      'Programme personnalisé'
    ];
  }
  
  if (level === 'pro') {
    return [
      ...baseFeatures,
      'Données cardiaques',
      'Niveau de stress',
      'Chat IA illimité',
      'Programme personnalisé',
      'Analyse de performance'
    ];
  }
  
  if (level === 'elite') {
    return [
      ...baseFeatures,
      'Données cardiaques',
      'Niveau de stress',
      'Score nutritionnel',
      'Chat IA illimité',
      'Programme personnalisé',
      'Analyse de performance',
      'Coach personnel'
    ];
  }
  
  return baseFeatures;
}

// Simuler une date de renouvellement (30 jours à partir d'aujourd'hui)
function getNextRenewalDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}
