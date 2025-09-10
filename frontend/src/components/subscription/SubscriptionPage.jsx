import React, { useState } from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';

const SubscriptionPage = () => {
  const { isPremium, upgradeToPremium } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Liste des avantages premium
  const premiumBenefits = [
    {
      icon: '💬',
      title: 'Messages illimités',
      description: 'Discutez sans limite avec notre coach IA pour obtenir des conseils personnalisés.'
    },
    {
      icon: '📊',
      title: 'Statistiques avancées',
      description: 'Accédez à des analyses détaillées de votre progression et des tendances de santé.'
    },
    {
      icon: '🥗',
      title: 'Plans nutritionnels personnalisés',
      description: 'Recevez des plans de repas adaptés à vos objectifs et préférences alimentaires.'
    },
    {
      icon: '🏋️',
      title: 'Programmes d\'entraînement exclusifs',
      description: 'Débloquez des séances d\'entraînement spécialement conçues par des experts.'
    },
    {
      icon: '🧠',
      title: 'Suivi mental avancé',
      description: 'Accédez à des outils de gestion du stress et d\'amélioration du sommeil.'
    }
  ];

  // Gérer le clic sur le bouton d'upgrade
  const handleUpgradeClick = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel à l'API pour upgrade (simulation pour l'instant)
      await upgradeToPremium();
      
      setSuccess(true);
      
      // Redirection vers la page d'accueil après 3 secondes
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la mise à niveau de votre abonnement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">Passez à Coach Santé Premium</h1>
      
      {/* Afficher un message d'erreur s'il y a une erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Afficher un message de succès si l'upgrade a réussi */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
          <span className="block sm:inline">
            <strong>Félicitations!</strong> Vous êtes maintenant un membre Premium. 
            Vous allez être redirigé vers la page d'accueil...
          </span>
        </div>
      )}
      
      {/* Carte principale */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Abonnement Premium</h2>
          <div className="text-4xl font-bold mb-4">29,99 €<span className="text-base font-normal">/mois</span></div>
          <p className="text-white/80">
            Débloquez votre plein potentiel avec notre plan Premium
          </p>
        </div>
        
        {/* Avantages */}
        <div className="px-6 py-8">
          <h3 className="text-xl font-semibold mb-6">Ce qui vous attend avec Premium :</h3>
          
          <ul className="space-y-6">
            {premiumBenefits.map((benefit, index) => (
              <li key={index} className="flex">
                <div className="text-3xl mr-4">{benefit.icon}</div>
                <div>
                  <h4 className="font-medium">{benefit.title}</h4>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Bouton d'action */}
          <div className="mt-10">
            {isPremium ? (
              <div className="text-center p-4 bg-green-100 rounded-lg text-green-700">
                <span className="font-bold">✅ Vous êtes déjà membre Premium</span>
                <p className="text-sm mt-1">Profitez de tous les avantages exclusifs!</p>
              </div>
            ) : (
              <button
                onClick={handleUpgradeClick}
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg transition duration-300 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Traitement en cours...
                  </>
                ) : (
                  <>Activer Premium</>
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Pied de page */}
        <div className="px-6 py-4 bg-gray-50 text-center text-gray-500 text-sm">
          <p>Pas d'engagement. Annulez à tout moment.</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
