import React, { createContext, useContext } from 'react';

// Création du contexte
const SubscriptionContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription doit être utilisé dans un SubscriptionProvider');
  }
  return context;
};

// Fournisseur du contexte
export const SubscriptionProvider = ({ children, isPremium = false }) => {

  // Valeur du contexte simplifiée
  const value = {
    isPremium,
    loading: false,
    error: null
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
