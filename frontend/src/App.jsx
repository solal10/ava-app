import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './utils/api';

// Contexte d'abonnement
import { SubscriptionProvider } from './contexts/SubscriptionContext';

// Composants communs
import ErrorBoundary from './components/common/ErrorBoundary';

// Composants
import NavBar from './components/navbar/NavBar';
import Login from './pages/Login';
import AuthPage from './components/auth/AuthPage';
import DashboardV2 from './components/dashboard/DashboardV2';
import HealthTrackerAIV2 from './components/health/HealthTrackerAIV2';
import GoalsTrackerV2 from './components/goals/GoalsTrackerV2';
import PremiumBadge from './components/subscription/PremiumBadge';
import { FoodAnalyzer } from './components/meal';
import MealAnalyzerV2 from './components/meal/MealAnalyzerV2';
import WorkoutPlannerV2 from './components/workout/WorkoutPlannerV2';
import LearnAdminDashboardV2 from './components/admin/LearnAdminDashboardV2';
import MainLayout from './components/layout/MainLayout';
import ChatIAV2 from './components/chat/ChatIAV2';
import SmartAdvice from './components/advice/SmartAdvice';
import SubscriptionPage from './components/subscription/SubscriptionPage';
import GarminCallback from './components/GarminCallback';
import { GarminAuthDone } from './pages/GarminAuthDone';

function App() {
  // État d'authentification réel
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Vérifier si un token existe dans le localStorage
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      // Dans une application réelle, nous validerions ce token avec le backend
      // Ici, on simule un utilisateur connecté
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(storedUser);
      setToken(storedToken);
    }
  }, []);

  // Gestion de la connexion
  const handleLogin = (userData, authToken) => {
    // On met juste à jour l'état local du composant
    setUser(userData);
    setToken(authToken);
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await authAPI.logout(); // Appel à notre fonction API centralisée
      // Les tokens seront supprimés dans authAPI.logout()
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // En cas d'erreur, on force quand même la déconnexion côté client
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  };

  // Wrapper pour les routes protégées
  const ProtectedRoute = ({ children }) => {
    // Vérifier le token dans localStorage si pas en mémoire
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    // Utiliser le token en mémoire ou celui du localStorage
    const hasValidAuth = (token && user) || (storedToken && storedUser);
    
    if (!hasValidAuth) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  return (
    <ErrorBoundary>
      <SubscriptionProvider isPremium={user?.isPremium || false}>
        <Routes>
          {/* Routes publiques d'authentification */}
          <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/auth" element={token ? <Navigate to="/" replace /> : <AuthPage onLogin={handleLogin} />} />
          
          {/* Routes OAuth Garmin */}
          <Route path="/auth/garmin/rappel" element={<GarminCallback />} />
          <Route path="/auth/garmin/done" element={<GarminAuthDone />} />

          {/* Routes protégées nécessitant une authentification */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <DashboardV2 />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/workout" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <WorkoutPlannerV2 user={user} />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/programme" element={<Navigate to="/workout" replace />} />
          <Route path="/repas" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <FoodAnalyzer />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/meal-analyzer" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <MealAnalyzerV2 user={user} />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <div className="container-app">
                  <div className="card text-center">
                    <h1 className="text-2xl font-bold text-text-primary mb-4">💬 Messages du coach</h1>
                    <p className="text-text-secondary">Cette fonctionnalité sera bientôt disponible.</p>
                  </div>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/evolution" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <div className="container-app">
                  <div className="card text-center">
                    <h1 className="text-2xl font-bold text-text-primary mb-4">📈 Mon évolution</h1>
                    <p className="text-text-secondary">Cette fonctionnalité sera bientôt disponible.</p>
                  </div>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <ChatIAV2 user={user} />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/health" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <HealthTrackerAIV2 user={user} />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/advice" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <SmartAdvice user={user} />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/upgrade" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <SubscriptionPage user={user} />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/goals" element={<Navigate to="/goals/tracker" replace />} />
          <Route path="/goals/tracker" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <GoalsTrackerV2 user={user} />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/learn" element={
            <ProtectedRoute>
              <MainLayout user={user}>
                <LearnAdminDashboardV2 />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Redirection par défaut vers la page de connexion si pas connecté, sinon dashboard */}
          <Route path="*" element={token ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </SubscriptionProvider>
    </ErrorBoundary>
  );
}

export default App;
