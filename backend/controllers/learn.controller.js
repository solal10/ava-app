const Learn = require('../models/learn.model');

// Créer un nouvel apprentissage/log
exports.createLog = async (req, res) => {
  try {
    const { userId, type, context, result } = req.body;
    const newLog = await Learn.create({ userId, type, context, result });
    res.status(201).json(newLog);
  } catch (error) {
    console.error('Erreur création log IA:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les logs d'un utilisateur
exports.getLogsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const logs = await Learn.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Erreur récupération logs IA:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir tous les logs pour l'admin (avec informations utilisateur)
exports.getAllLogs = async (req, res) => {
  try {
    const logs = await Learn.find({})
      .populate('userId', 'email prenom')
      .sort({ timestamp: -1 })
      .limit(100);
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const formattedLogs = logs.map(log => ({
      user: log.userId ? log.userId.email : 'Utilisateur supprimé',
      type: mapTypeToFrontend(log.type),
      content: formatContent(log),
      timestamp: log.timestamp
    }));
    
    res.status(200).json(formattedLogs);
  } catch (error) {
    console.error('Erreur récupération tous les logs IA:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction helper pour mapper les types backend vers frontend
function mapTypeToFrontend(backendType) {
  const typeMapping = {
    'advice': 'chat_message',
    'chat': 'chat_message',
    'health': 'chat_message',
    'workout': 'goal_created',
    'nutrition': 'meal_analysis',
    'goals': 'goal_created'
  };
  return typeMapping[backendType] || backendType;
}

// Fonction helper pour formater le contenu
function formatContent(log) {
  if (log.metadata && log.metadata.userInput) {
    return `${log.context} - Input: ${log.metadata.userInput.substring(0, 100)}...`;
  }
  return log.context || log.result || 'Aucun contenu disponible';
}


