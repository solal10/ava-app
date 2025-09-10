import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * Pages de gestion des retours OAuth Garmin
 */

// Page de succès OAuth
export const GarminAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const expiresIn = searchParams.get('expires_in');

    if (accessToken) {
      // Stocker les tokens
      localStorage.setItem('garmin_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('garmin_refresh_token', refreshToken);
      }
      localStorage.setItem('garmin_token_expires', Date.now() + (parseInt(expiresIn) * 1000));
      
      setTokens({ accessToken, refreshToken, expiresIn });
      
      // Rediriger vers le dashboard après 3 secondes
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ✅ Connexion Garmin réussie !
          </h1>
          <p className="text-slate-300 mb-4">
            Votre compte Garmin a été connecté avec succès à AVA.
          </p>
          {tokens && (
            <div className="bg-slate-700 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm text-slate-400 mb-2">Tokens reçus :</p>
              <p className="text-xs text-green-400 font-mono break-all">
                Access Token: {tokens.accessToken.substring(0, 20)}...
              </p>
              {tokens.refreshToken && (
                <p className="text-xs text-blue-400 font-mono break-all">
                  Refresh Token: {tokens.refreshToken.substring(0, 20)}...
                </p>
              )}
              <p className="text-xs text-slate-300">
                Expire dans: {tokens.expiresIn} secondes
              </p>
            </div>
          )}
          <p className="text-slate-400 text-sm">
            Redirection vers le dashboard dans 3 secondes...
          </p>
        </div>
      </div>
    </div>
  );
};

// Page d'erreur OAuth
export const GarminAuthError = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'missing_parameters':
        return 'Paramètres OAuth manquants dans la réponse Garmin.';
      case 'code_already_used':
        return 'Ce code d\'autorisation a déjà été utilisé. Veuillez réessayer.';
      case 'invalid_state':
        return 'Token de sécurité invalide ou expiré.';
      case 'rate_limit_exceeded':
        return 'Trop de tentatives de connexion. Attendez quelques minutes avant de réessayer.';
      case 'network_error':
        return 'Erreur de connexion au serveur Garmin.';
      case 'internal_error':
        return 'Erreur interne du serveur.';
      default:
        return `Erreur OAuth: ${errorCode || 'Erreur inconnue'}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ❌ Erreur de connexion Garmin
          </h1>
          <p className="text-slate-300 mb-4">
            {getErrorMessage(error)}
          </p>
          <div className="bg-slate-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-400 mb-2">Code d'erreur :</p>
            <p className="text-xs text-red-400 font-mono">
              {error || 'UNKNOWN_ERROR'}
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Retour au dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Réessayer la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
