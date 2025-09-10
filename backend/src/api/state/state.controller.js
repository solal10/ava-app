// Simulation de données pour différents niveaux d'abonnement
const getStateData = (subscriptionLevel) => {
  // Données de base disponibles pour tous les niveaux
  const baseData = {
    bodyBattery: Math.floor(Math.random() * 100),
    sleepScore: Math.floor(Math.random() * 100)
  };

  // Données supplémentaires selon le niveau d'abonnement
  if (['perform', 'pro', 'elite'].includes(subscriptionLevel)) {
    baseData.hrResting = 55 + Math.floor(Math.random() * 15); // 55-70 bpm
  }

  if (['pro', 'elite'].includes(subscriptionLevel)) {
    baseData.stressLevel = Math.floor(Math.random() * 100);
  }

  if (subscriptionLevel === 'elite') {
    baseData.nutritionScore = Math.floor(Math.random() * 100);
  }

  return baseData;
};

exports.getUserState = async (req, res) => {
  try {
    const { subscriptionLevel } = req;
    
    if (!subscriptionLevel) {
      return res.status(400).json({ message: 'Niveau d\'abonnement non spécifié' });
    }

    const stateData = getStateData(subscriptionLevel);
    
    res.status(200).json({
      subscriptionLevel,
      data: stateData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données d\'état', error: error.message });
  }
};

// Fonction pour simuler la mise à jour des données depuis les SDK
exports.updateStateFromSdk = async (req, res) => {
  try {
    const { source, data } = req.body;
    
    if (!['garmin', 'applewatch', 'suunto'].includes(source)) {
      return res.status(400).json({ message: 'Source de données non reconnue' });
    }
    
    // Cette fonction est un placeholder pour l'intégration future des SDK
    // Pour l'instant, elle ne fait que confirmer la réception des données
    
    res.status(200).json({
      message: `Données reçues avec succès depuis ${source}`,
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des données d\'état', error: error.message });
  }
};
