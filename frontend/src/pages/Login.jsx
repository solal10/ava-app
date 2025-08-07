// 📁 frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:5003/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Stocker le token et les informations utilisateur (format attendu par App.jsx)
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.user?.id || data.userId,
          name: data.user?.prenom || 'Utilisateur',
          email: email,
          isPremium: data.user?.isPremium || false,
          subscriptionLevel: data.user?.subscriptionLevel || 'explore',
          stats: data.user?.stats || {},
          goals: data.user?.goals || {},
          preferences: data.user?.preferences || {}
        }));
        
        // Recharger la page pour que App.jsx détecte la connexion
        window.location.href = '/';
      } else {
        setError(data.message || 'Connexion échouée');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Erreur de connexion serveur');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour tester avec un compte de démonstration
  const handleDemoLogin = async (userType) => {
    const demoUsers = {
      premium: { email: 'thomas@coach.com', password: 'motdepasse123' },
      gratuit: { email: 'sarah@coach.com', password: 'motdepasse123' }
    };
    
    const demoUser = demoUsers[userType];
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('http://localhost:5003/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoUser.email, password: demoUser.password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Stocker le token et les informations utilisateur (format attendu par App.jsx)
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.user?.id || data.userId,
          name: data.user?.prenom || 'Utilisateur',
          email: demoUser.email,
          isPremium: data.user?.isPremium || false,
          subscriptionLevel: data.user?.subscriptionLevel || 'explore',
          stats: data.user?.stats || {},
          goals: data.user?.goals || {},
          preferences: data.user?.preferences || {}
        }));
        
        // Recharger la page pour que App.jsx détecte la connexion
        window.location.href = '/';
      } else {
        setError(data.message || 'Connexion échouée');
      }
    } catch (err) {
      console.error('Erreur de connexion démo:', err);
      setError('Erreur de connexion serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      {/* Logo et titre */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🏥</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Coach Santé IA</h1>
        <p className="text-gray-600">Votre assistant santé personnalisé</p>
      </div>

      {/* Formulaire de connexion */}
      <form 
        onSubmit={handleLogin} 
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Connexion</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              disabled={isLoading}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className={`w-full p-3 rounded-xl font-medium transition-all ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
          } text-white shadow-lg`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Connexion...
            </div>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      {/* Comptes de démonstration */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          🧪 Comptes de démonstration
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => handleDemoLogin('premium')}
            className="w-full p-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-medium hover:scale-105 transition-all shadow-lg"
            disabled={isLoading}
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">👑</span>
              Tester Premium (Thomas)
            </div>
          </button>
          
          <button
            onClick={() => handleDemoLogin('gratuit')}
            className="w-full p-3 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-xl font-medium hover:scale-105 transition-all shadow-lg"
            disabled={isLoading}
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">👤</span>
              Tester Gratuit (Sarah)
            </div>
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Utilisez ces comptes pour découvrir l'application
        </p>
      </div>

      {/* Liens utiles */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Pas encore de compte ? 
          <button 
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:text-blue-800 font-medium ml-1"
          >
            S'inscrire
          </button>
        </p>
        <p className="mt-2">
          <button 
            onClick={() => navigate('/forgot-password')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Mot de passe oublié ?
          </button>
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>© 2025 Coach Santé IA - Votre bien-être, notre priorité</p>
      </div>
    </div>
  );
};

export default Login;
