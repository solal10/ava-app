// Base de connaissances simplifiée pour le coach IA
const knowledgeTopics = [
  'sport', 'santé', 'entraînement', 'motivation', 'alimentation', 
  'récupération', 'psychologie sportive', 'musculation', 'cardio', 
  'étirement', 'hydratation', 'sommeil', 'blessure', 'performance'
];

// Vérifier si une question est liée au domaine de compétence
const isRelevantTopic = (question) => {
  question = question.toLowerCase();
  return knowledgeTopics.some(topic => question.includes(topic.toLowerCase()));
};

// Réponses simples par défaut (à remplacer par un vrai système IA plus tard)
const getBasicResponse = (topic) => {
  const responses = {
    sport: "Pour progresser dans votre sport, la régularité et la progression graduelle sont essentielles.",
    santé: "Une bonne santé repose sur l'équilibre entre activité physique, alimentation et repos.",
    entraînement: "Variez vos entraînements pour stimuler différents groupes musculaires et éviter la routine.",
    motivation: "Fixez-vous des objectifs SMART : Spécifiques, Mesurables, Atteignables, Réalistes et Temporels.",
    alimentation: "Privilégiez les aliments non transformés et assurez-vous de consommer suffisamment de protéines.",
    récupération: "La récupération est aussi importante que l'entraînement pour progresser.",
    'psychologie sportive': "La visualisation positive peut améliorer significativement vos performances."
  };

  for (const key in responses) {
    if (topic.includes(key)) {
      return responses[key];
    }
  }

  return "Pour atteindre vos objectifs, écoutez votre corps et restez constant dans vos efforts.";
};

// Compteur de requêtes par utilisateur (simulé - à remplacer par une base de données)
const userRequestCounts = {};

exports.askCoach = async (req, res) => {
  try {
    const { userId, subscriptionLevel } = req;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question manquante' });
    }

    // Vérifier si la question est dans le domaine de compétence
    if (!isRelevantTopic(question)) {
      return res.status(403).json({ 
        message: 'Je suis un coach santé. Je ne peux pas t\'aider sur ce sujet.' 
      });
    }

    // Gestion des limites pour le niveau "explore"
    if (subscriptionLevel === 'explore') {
      // Initialiser le compteur si nécessaire
      if (!userRequestCounts[userId]) {
        userRequestCounts[userId] = 0;
      }

      // Vérifier si l'utilisateur a atteint sa limite
      if (userRequestCounts[userId] >= 3) {
        return res.status(403).json({
          message: 'Limite de 3 questions par semaine atteinte pour le niveau Explore',
          upgrade: true
        });
      }

      // Incrémenter le compteur
      userRequestCounts[userId]++;
    }

    // Générer une réponse (simulée pour l'instant)
    const response = getBasicResponse(question);

    res.status(200).json({
      question,
      response,
      requestCount: subscriptionLevel === 'explore' ? userRequestCounts[userId] : null,
      maxRequests: subscriptionLevel === 'explore' ? 3 : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la communication avec l\'IA', error: error.message });
  }
};

// Fonction d'apprentissage pour l'évolution future du système
exports.learnFromUserInput = async (req, res) => {
  try {
    const { question, feedback, correctAnswer } = req.body;
    
    if (!question || !feedback) {
      return res.status(400).json({ message: 'Données d\'apprentissage incomplètes' });
    }

    // Cette fonction est un placeholder pour l'implémentation future
    // Elle pourrait être utilisée pour alimenter un modèle d'apprentissage
    
    console.log('Données d\'apprentissage reçues:', { question, feedback, correctAnswer });
    
    res.status(200).json({ 
      message: 'Merci pour votre retour, il nous aidera à améliorer le système',
      recorded: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement du retour', error: error.message });
  }
};
