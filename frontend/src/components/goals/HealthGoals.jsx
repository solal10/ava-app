import React, { useState, useEffect } from 'react';
import userAPI from '../../api/userAPI';

// Composant pour définir les objectifs de santé personnalisés
const HealthGoals = ({ user }) => {
  // Structure des objectifs avec les valeurs par défaut
  const defaultGoals = {
    sommeil: 8,     // heures
    hydratation: 2, // litres
    stress: 3,      // niveau (0-10, où 0 est le meilleur)
    activite: 60,   // minutes d'activité physique
    energie: 8      // niveau d'énergie (0-10)
  };

  // États pour les objectifs et l'interface utilisateur
  const [goals, setGoals] = useState(defaultGoals);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Charger les objectifs au chargement du composant
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Essayer de récupérer les objectifs depuis le backend
        const response = await userAPI.getGoals();
        
        if (response && response.goals) {
          setGoals(response.goals);
        } else {
          // Si pas de réponse valide, essayer de récupérer depuis le localStorage
          const savedGoals = localStorage.getItem('health_goals');
          if (savedGoals) {
            setGoals(JSON.parse(savedGoals));
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des objectifs:', err);
        setError("Impossible de charger vos objectifs. Utilisez les valeurs par défaut ou réessayez plus tard.");
        
        // En cas d'erreur, essayer le localStorage comme fallback
        try {
          const savedGoals = localStorage.getItem('health_goals');
          if (savedGoals) {
            setGoals(JSON.parse(savedGoals));
          }
        } catch (localErr) {
          console.error('Erreur lors de la récupération des objectifs du localStorage:', localErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  // Gérer les changements dans les objectifs
  const handleGoalChange = (metric, value) => {
    setGoals(prevGoals => ({
      ...prevGoals,
      [metric]: parseFloat(value)
    }));
  };

  // Enregistrer les objectifs
  const handleSaveGoals = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      // Sauvegarder dans le backend
      await userAPI.setGoals(goals);
      
      // Sauvegarder également dans le localStorage comme fallback
      localStorage.setItem('health_goals', JSON.stringify(goals));
      
      // Afficher message de succès
      setSuccess(true);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des objectifs:', err);
      setError("Impossible d'enregistrer vos objectifs sur le serveur. Vos objectifs ont été sauvegardés localement.");
      
      // En cas d'échec du backend, sauvegarder dans le localStorage
      localStorage.setItem('health_goals', JSON.stringify(goals));
      
      // Quand même considérer comme un succès partiel
      setSuccess(true);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  // Si en cours de chargement, afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes Objectifs Santé</h1>
      
      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>Vos objectifs ont été enregistrés avec succès!</p>
        </div>
      )}
      
      <form onSubmit={handleSaveGoals} className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-600 mb-6">
          Définissez vos objectifs personnels pour chaque métrique de santé. Ces valeurs serviront de référence pour évaluer votre progression.
        </p>
        
        {/* Sommeil */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Sommeil (heures/jour)
          </label>
          <div className="flex items-center">
            <input 
              type="range" 
              min="4" 
              max="12" 
              step="0.5" 
              value={goals.sommeil} 
              onChange={(e) => handleGoalChange('sommeil', e.target.value)} 
              className="w-full mr-4"
            />
            <div className="w-16 flex">
              <input 
                type="number" 
                min="4" 
                max="12" 
                step="0.5" 
                value={goals.sommeil} 
                onChange={(e) => handleGoalChange('sommeil', e.target.value)} 
                className="input w-16 text-center" 
              />
              <span className="ml-1 text-gray-600">h</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Un adulte a besoin de 7 à 9 heures de sommeil par nuit en moyenne.
          </p>
        </div>
        
        {/* Hydratation */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Hydratation (litres/jour)
          </label>
          <div className="flex items-center">
            <input 
              type="range" 
              min="0.5" 
              max="4" 
              step="0.1" 
              value={goals.hydratation} 
              onChange={(e) => handleGoalChange('hydratation', e.target.value)} 
              className="w-full mr-4"
            />
            <div className="w-16 flex">
              <input 
                type="number" 
                min="0.5" 
                max="4" 
                step="0.1" 
                value={goals.hydratation} 
                onChange={(e) => handleGoalChange('hydratation', e.target.value)} 
                className="input w-16 text-center" 
              />
              <span className="ml-1 text-gray-600">L</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            La recommandation moyenne est de 1.5 à 2.5 litres d'eau par jour.
          </p>
        </div>
        
        {/* Niveau de stress */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Niveau de stress maximal (0-10)
          </label>
          <div className="flex items-center">
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="1" 
              value={goals.stress} 
              onChange={(e) => handleGoalChange('stress', e.target.value)} 
              className="w-full mr-4"
            />
            <input 
              type="number" 
              min="0" 
              max="10" 
              value={goals.stress} 
              onChange={(e) => handleGoalChange('stress', e.target.value)} 
              className="input w-16 text-center" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            0 = aucun stress, 10 = stress extrême. Visez un objectif bas.
          </p>
        </div>
        
        {/* Activité physique */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Activité physique (minutes/jour)
          </label>
          <div className="flex items-center">
            <input 
              type="range" 
              min="0" 
              max="180" 
              step="5" 
              value={goals.activite} 
              onChange={(e) => handleGoalChange('activite', e.target.value)} 
              className="w-full mr-4"
            />
            <div className="w-16 flex">
              <input 
                type="number" 
                min="0" 
                max="180" 
                step="5" 
                value={goals.activite} 
                onChange={(e) => handleGoalChange('activite', e.target.value)} 
                className="input w-16 text-center" 
              />
              <span className="ml-1 text-gray-600">min</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            L'OMS recommande au moins 30 minutes d'activité modérée par jour.
          </p>
        </div>
        
        {/* Niveau d'énergie */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Niveau d'énergie minimal (0-10)
          </label>
          <div className="flex items-center">
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="1" 
              value={goals.energie} 
              onChange={(e) => handleGoalChange('energie', e.target.value)} 
              className="w-full mr-4"
            />
            <input 
              type="number" 
              min="0" 
              max="10" 
              value={goals.energie} 
              onChange={(e) => handleGoalChange('energie', e.target.value)} 
              className="input w-16 text-center" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            0 = épuisé, 10 = plein d'énergie. Visez un objectif élevé.
          </p>
        </div>
        
        {/* Bouton de sauvegarde */}
        <div className="flex justify-center mt-8">
          <button 
            type="submit" 
            className={`btn btn-primary px-8 py-3 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={saving}
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </>
            ) : 'Enregistrer mes objectifs'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthGoals;
