const User = require('../../models/user.model');
<<<<<<< HEAD
const PaymentHistory = require('../../models/paymenthistory.model');
=======
>>>>>>> 5592fc713bb370061e61278d69a4f336199f21d2
const paymentService = require('../../services/payment.service');

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

// Créer une session de paiement
exports.createPaymentSession = async (req, res) => {
  try {
    const { level, billingPeriod = 'monthly' } = req.body;

    // Vérifier si le niveau est valide
    if (!['perform', 'pro', 'elite'].includes(level)) {
      return res.status(400).json({ message: 'Niveau d\'abonnement invalide' });
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return res.status(400).json({ message: 'Période de facturation invalide' });
    }

    const result = await paymentService.createCheckoutSession(req.userId, level, billingPeriod);

    return res.status(200).json({
      message: 'Session de paiement créée',
      sessionId: result.sessionId,
      sessionUrl: result.sessionUrl,
      customerId: result.customerId
    });

  } catch (error) {
    console.error('Erreur création session paiement:', error);
    return res.status(500).json({ 
      message: 'Erreur lors de la création de la session de paiement', 
      error: error.message 
    });
  }
};

// Gérer les webhooks Stripe
exports.handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({ error: 'Signature manquante' });
    }

    await paymentService.handleWebhook(req.body, signature);
    
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Erreur webhook Stripe:', error);
    return res.status(400).json({ error: error.message });
  }
};

// Annuler l'abonnement
exports.cancelSubscription = async (req, res) => {
  try {
    const result = await paymentService.cancelSubscription(req.userId);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Erreur annulation abonnement:', error);
    return res.status(500).json({ 
      message: 'Erreur lors de l\'annulation', 
      error: error.message 
    });
  }
};

// Récupérer l'historique des paiements
exports.getPaymentHistory = async (req, res) => {
  try {
    const history = await paymentService.getPaymentHistory(req.userId);

    return res.status(200).json(history);

  } catch (error) {
    console.error('Erreur historique paiements:', error);
    return res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'historique', 
      error: error.message 
    });
  }
};

// Créer un portail client
exports.createPortalSession = async (req, res) => {
  try {
    const result = await paymentService.createPortalSession(req.userId);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Erreur création portail:', error);
    return res.status(500).json({ 
      message: 'Erreur lors de la création du portail client', 
      error: error.message 
    });
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

<<<<<<< HEAD
// Récupérer l'historique des paiements de l'utilisateur
exports.getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req;
    const { limit = 20, offset = 0 } = req.query;

    const payments = await PaymentHistory.find({ userId })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const totalPayments = await PaymentHistory.countDocuments({ userId });

    res.status(200).json({
      message: 'Historique des paiements récupéré avec succès',
      payments,
      pagination: {
        total: totalPayments,
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: parseInt(offset) + parseInt(limit) < totalPayments
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération historique paiements:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'historique des paiements',
      error: error.message
    });
  }
};

// Enregistrer un paiement dans l'historique
exports.recordPayment = async (userId, paymentData) => {
  try {
    const payment = new PaymentHistory({
      userId,
      ...paymentData,
      createdAt: new Date()
    });

    await payment.save();
    console.log(`✅ Paiement enregistré pour l'utilisateur ${userId}`);
    return { success: true, payment };
  } catch (error) {
    console.error('❌ Erreur enregistrement paiement:', error);
    return { success: false, error: error.message };
  }
};

=======
>>>>>>> 5592fc713bb370061e61278d69a4f336199f21d2
// Simuler une date de renouvellement (30 jours à partir d'aujourd'hui)
function getNextRenewalDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}
