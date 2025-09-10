import React from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';

/**
 * Composant qui affiche un badge PREMIUM si l'utilisateur est premium
 */
const PremiumBadge = () => {
  const { isPremium } = useSubscription();

  // N'afficher le badge que si l'utilisateur est premium
  if (!isPremium) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg flex items-center">
        <span className="mr-1">⭐</span>
        PREMIUM
      </div>
    </div>
  );
};

export default PremiumBadge;
