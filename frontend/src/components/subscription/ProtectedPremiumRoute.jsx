import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';

/**
 * Composant qui protège les routes premium
 * Redirige vers la page d'upgrade si l'utilisateur n'est pas premium
 */
const ProtectedPremiumRoute = ({ children }) => {
  const { isPremium, loading } = useSubscription();
  const location = useLocation();
  
  // Si en cours de chargement, afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-2 text-gray-600">Vérification de votre abonnement...</p>
      </div>
    );
  }
  
  // Si l'utilisateur n'est pas premium, rediriger vers la page d'upgrade
  if (!isPremium) {
    return <Navigate to="/upgrade" state={{ from: location }} replace />;
  }
  
  // Si l'utilisateur est premium, afficher le contenu protégé
  return children;
};

export default ProtectedPremiumRoute;
