const Health = require('../../models/health.model');
const User = require('../../models/user.model');

// Ajouter une nouvelle entrée de santé
exports.addHealthEntry = async (req, res) => {
  try {
    const { userId } = req.params;
    const healthData = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Créer une nouvelle entrée de santé
    const healthEntry = new Health({
      userId,
      metrics: healthData.metrics,
      healthScore: healthData.healthScore,
      notes: healthData.notes,
      source: healthData.source || 'manual'
    });

    // Sauvegarder l'entrée
    await healthEntry.save();

    // Mettre à jour les statistiques actuelles de l'utilisateur
    user.stats = {
      sommeil: healthData.metrics.sommeil?.qualite || user.stats.sommeil,
      stress: healthData.metrics.stress?.niveau || user.stats.stress,
      hydratation: healthData.metrics.hydratation?.score || user.stats.hydratation,
      energie: healthData.metrics.energie?.niveau || user.stats.energie,
      activite: healthData.metrics.activite ? 
        (healthData.metrics.activite.duree > 30 ? 70 : 50) : 
        user.stats.activite
    };

    await user.save();

    res.status(201).json({ 
      message: 'Données de santé enregistrées avec succès',
      healthEntry,
      updatedStats: user.stats
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout des données de santé:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'ajout des données de santé', 
      error: error.message 
    });
  }
};

// Récupérer l'historique des métriques de santé d'un utilisateur
exports.getHealthHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 30, skip = 0, startDate, endDate } = req.query;

    // Construire le filtre de date si nécessaire
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Construire la requête
    const query = { userId };
    if (startDate || endDate) query.date = dateFilter;

    // Récupérer l'historique des données de santé
    const healthHistory = await Health.find(query)
      .sort({ date: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Compter le nombre total d'entrées
    const total = await Health.countDocuments(query);

    res.status(200).json({
      healthHistory,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique de santé:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'historique de santé', 
      error: error.message 
    });
  }
};

// Récupérer la dernière entrée de santé d'un utilisateur
exports.getLatestHealth = async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer la dernière entrée de santé
    const latestHealth = await Health.findOne({ userId })
      .sort({ date: -1 });

    if (!latestHealth) {
      return res.status(404).json({ message: 'Aucune donnée de santé trouvée' });
    }

    res.status(200).json({ latestHealth });
  } catch (error) {
    console.error('Erreur lors de la récupération des dernières données de santé:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des dernières données de santé', 
      error: error.message 
    });
  }
};
