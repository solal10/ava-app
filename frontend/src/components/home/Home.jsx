import React, { useState, useEffect } from 'react';
import userAPI from '../../api/userAPI';

const Home = ({ user }) => {
  const [stateData, setStateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStateData = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getStats();
        
        // Traitement des données reçues
        const statsData = {
          subscriptionLevel: user.subscriptionLevel,
          data: response.data,
          timestamp: response.timestamp || new Date().toISOString()
        };
        
        setStateData(statsData);
      } catch (err) {
        console.error('Erreur lors de la récupération des données d\'état:', err);
        setError(err.message || 'Impossible de récupérer vos données d\'état');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStateData();
    }
  }, [user]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStateCard = (title, value, description, isLocked = false) => {
    return (
      <div className="card mb-4">
        {isLocked ? (
          <div className="flex flex-col items-center justify-center p-4 opacity-60">
            <div className="text-gray-400 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm mt-1">Passez à un abonnement supérieur pour débloquer</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <div className="text-3xl font-bold mb-2 flex items-center">
              <span className={getScoreColor(value)}>{value}</span>
              <span className="text-sm text-gray-500 ml-1">/100</span>
            </div>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Votre état du jour</h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Disponible pour tous les abonnements */}
        {renderStateCard(
          'Batterie corporelle',
          stateData.data.bodyBattery,
          'Représente votre niveau d\'énergie global'
        )}
        
        {renderStateCard(
          'Score de sommeil',
          stateData.data.sleepScore,
          'Qualité et quantité de votre sommeil'
        )}
        
        {/* Fréquence cardiaque disponible à partir de Perform */}
        {renderStateCard(
          'Fréquence cardiaque au repos',
          stateData.data.hrResting || 0,
          'Votre fréquence cardiaque au repos',
          user.subscriptionLevel === 'explore'
        )}
        
        {/* Niveau de stress disponible à partir de Pro */}
        {renderStateCard(
          'Niveau de stress',
          stateData.data.stressLevel || 0,
          'Votre niveau de stress actuel',
          !['pro', 'elite'].includes(user.subscriptionLevel)
        )}
        
        {/* Score de nutrition disponible uniquement pour Elite */}
        {renderStateCard(
          'Score de nutrition',
          stateData.data.nutritionScore || 0,
          'Qualité de votre alimentation récente',
          user.subscriptionLevel !== 'elite'
        )}
      </div>

      {user.subscriptionLevel === 'explore' && (
        <div className="mt-8 bg-secondary-light bg-opacity-20 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-secondary-dark mb-2">Débloquez toutes les fonctionnalités</h2>
          <p className="mb-4">Passez à un abonnement supérieur pour accéder à toutes les données et fonctionnalités.</p>
          <button className="btn btn-secondary">Passer à Perform</button>
        </div>
      )}
    </div>
  );
};

export default Home;
