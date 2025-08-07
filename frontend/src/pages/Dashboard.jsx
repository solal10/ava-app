// 📁 frontend/src/pages/Dashboard.jsx
// ⚙️ Injecter les données du SDK (wearablesBridge.js)

import { useEffect, useState } from "react";
import { fetchFromGarmin, fetchFromAppleHealth } from "../sdk/wearablesBridge";

const Dashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = "demo-user"; // À remplacer plus tard par l'utilisateur connecté

  useEffect(() => {
    async function loadHealthMetrics() {
      try {
        setLoading(true);
        setError(null);
        
        // Simuler Garmin (ou Apple)
        const garminData = await fetchFromGarmin(userId);
        setHealthData(garminData);
      } catch (err) {
        console.error("Erreur de chargement des données de montre :", err);
        setError("Impossible de charger les données de votre montre connectée");
      } finally {
        setLoading(false);
      }
    }

    loadHealthMetrics();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données de votre montre connectée…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Tableau de Bord</h1>
          <p className="text-gray-600">Données connectées depuis votre montre Garmin</p>
          <p className="text-sm text-gray-500 mt-1">
            Dernière synchronisation : {new Date(healthData.timestamp).toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            title="Sommeil" 
            value={`${healthData.sleep} h`} 
            icon="😴"
            color="blue"
            description="Durée de sommeil"
          />
          <MetricCard 
            title="Pas" 
            value={`${healthData.steps.toLocaleString()}`} 
            icon="👟"
            color="green"
            description="Pas aujourd'hui"
          />
          <MetricCard 
            title="FC Repos" 
            value={`${healthData.heartRate} bpm`} 
            icon="❤️"
            color="red"
            description="Fréquence cardiaque"
          />
          <MetricCard 
            title="Hydratation" 
            value={`${healthData.hydration} L`} 
            icon="💧"
            color="cyan"
            description="Eau consommée"
          />
          <MetricCard 
            title="Stress" 
            value={`${healthData.stress}/5`} 
            icon="🧘‍♂️"
            color="purple"
            description="Niveau de stress"
          />
          <MetricCard 
            title="Énergie" 
            value={`${healthData.energy}%`} 
            icon="⚡"
            color="yellow"
            description="Niveau d'énergie"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton 
              icon="🔄" 
              title="Synchroniser" 
              description="Actualiser les données"
              onClick={() => window.location.reload()}
            />
            <QuickActionButton 
              icon="📈" 
              title="Tendances" 
              description="Voir l'évolution"
            />
            <QuickActionButton 
              icon="🎯" 
              title="Objectifs" 
              description="Définir des cibles"
            />
            <QuickActionButton 
              icon="⚙️" 
              title="Paramètres" 
              description="Configurer l'app"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, description }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    cyan: 'border-cyan-200 bg-cyan-50',
    purple: 'border-purple-200 bg-purple-50',
    yellow: 'border-yellow-200 bg-yellow-50'
  };

  return (
    <div className={`bg-white shadow-sm rounded-xl p-6 border-2 ${colorClasses[color]} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="text-right">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
};

const QuickActionButton = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-center"
  >
    <span className="text-2xl mb-2">{icon}</span>
    <span className="font-medium text-gray-900 text-sm">{title}</span>
    <span className="text-xs text-gray-500 mt-1">{description}</span>
  </button>
);

export default Dashboard;
