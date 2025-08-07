import React, { useState } from 'react';
import { authAPI } from '../../utils/api';

const AuthPage = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subscriptionLevel, setSubscriptionLevel] = useState('explore');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const response = await authAPI.login(email, password);
        onLogin(response.user, response.token);
      } else if (activeTab === 'test') {
        const response = await authAPI.testLogin(subscriptionLevel);
        onLogin(response.user, response.token);
      }
    } catch (err) {
      console.error('Erreur d\'authentification:', err);
      setError(err.message || 'Erreur lors de la connexion. Veuillez vérifier vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSubscriptionDetails = () => {
    const subscriptions = {
      explore: {
        title: 'Explore',
        price: 'Gratuit',
        features: [
          'Accès à la batterie corporelle',
          'Accès au score de sommeil',
          '3 questions au coach IA par semaine'
        ]
      },
      perform: {
        title: 'Perform',
        price: '9,99 € / mois',
        features: [
          'Tout ce qui est inclus dans Explore',
          'Accès à la fréquence cardiaque au repos',
          'Questions illimitées au coach IA'
        ]
      },
      pro: {
        title: 'Pro',
        price: '19,99 € / mois',
        features: [
          'Tout ce qui est inclus dans Perform',
          'Accès au niveau de stress',
          'Programmes d\'entraînement personnalisés'
        ]
      },
      elite: {
        title: 'Elite',
        price: '29,99 € / mois',
        features: [
          'Tout ce qui est inclus dans Pro',
          'Accès au score nutritionnel',
          'Consultation personnelle avec un coach'
        ]
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.keys(subscriptions).map((level) => {
          const sub = subscriptions[level];
          const isSelected = subscriptionLevel === level;
          
          return (
            <div 
              key={level}
              className={`card cursor-pointer transition-all ${
                isSelected 
                  ? 'border-2 border-primary shadow-md' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSubscriptionLevel(level)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{sub.title}</h3>
                {isSelected && (
                  <div className="bg-primary text-white rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-xl font-bold mb-4">{sub.price}</div>
              <ul className="text-sm space-y-2">
                {sub.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="h-5 w-5 text-primary mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-full py-12 px-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Coach Santé Intelligent</h1>
          <p className="mt-2 text-gray-600">Votre partenaire pour atteindre vos objectifs de santé et de fitness</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Onglets */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-4 px-6 text-center ${
                activeTab === 'login'
                  ? 'border-b-2 border-primary font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('login')}
            >
              Connexion
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center ${
                activeTab === 'test'
                  ? 'border-b-2 border-primary font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('test')}
            >
              Mode test
            </button>
          </div>

          {/* Formulaire */}
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {activeTab === 'login' ? (
                <>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-gray-700 mb-2">Mot de passe</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4">Sélectionnez un niveau d'abonnement</h3>
                  {renderSubscriptionDetails()}
                </>
              )}

              <div className="flex justify-center">
                <button
                  type="submit"
                  className={`btn btn-primary w-full max-w-xs ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Chargement...
                    </span>
                  ) : activeTab === 'login' ? (
                    'Se connecter'
                  ) : (
                    'Commencer le test'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
