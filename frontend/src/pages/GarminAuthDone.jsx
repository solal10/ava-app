import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * Page finale OAuth Garmin - /auth/garmin/done
 * Gère les retours de callback avec status=ok/error
 */
export const GarminAuthDone = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const status = searchParams.get('status');
  const reason = searchParams.get('reason');
  const message = searchParams.get('message');
  const httpStatus = searchParams.get('http_status');

  const isSuccess = status === 'ok';

  useEffect(() => {
    // Stocker les tokens si présents
    const tokensParam = searchParams.get('tokens');
    if (tokensParam && status === 'ok') {
      try {
        const tokenData = JSON.parse(decodeURIComponent(tokensParam));
        localStorage.setItem('garmin_access_token', tokenData.access_token);
        localStorage.setItem('garmin_refresh_token', tokenData.refresh_token || '');
        localStorage.setItem('garmin_token_expires', (Date.now() + (tokenData.expires_in * 1000)).toString());
        console.log('✅ Tokens Garmin stockés avec succès');
      } catch (error) {
        console.error('❌ Erreur stockage tokens:', error);
      }
    }

    // Countdown pour redirection automatique
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, searchParams, status]);

  const getStatusIcon = () => {
    if (isSuccess) {
      return (
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
  };

  const getStatusMessage = () => {
    if (isSuccess) {
      return {
        title: '✅ Connexion Garmin réussie !',
        description: 'Votre compte Garmin Connect a été connecté avec succès à AVA. Les tokens ont été stockés de manière sécurisée côté serveur.',
        details: message || 'tokens_stored'
      };
    } else {
      const errorMessages = {
        'missing_parameters': 'Paramètres OAuth manquants dans la réponse de Garmin.',
        'code_already_used': 'Ce code d\'autorisation a déjà été utilisé. Protection anti-double usage activée.',
        'invalid_state': 'Token de sécurité (state) invalide ou expiré.',
        'token_exchange_failed': 'Échec de l\'échange du code contre un token d\'accès.',
        'rate_limit_exceeded': 'Trop de tentatives de connexion. Attendez quelques minutes.',
        'unauthorized': 'Credentials Garmin invalides ou permissions insuffisantes.',
        'server_error': 'Erreur serveur Garmin. Réessayez plus tard.',
        'network_exception': 'Erreur de connexion réseau vers Garmin.',
        'internal_error': 'Erreur interne du serveur AVA.'
      };

      return {
        title: '❌ Erreur de connexion Garmin',
        description: errorMessages[reason] || `Erreur OAuth: ${reason || 'Erreur inconnue'}`,
        details: httpStatus ? `Code HTTP: ${httpStatus}` : reason
      };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-lg w-full">
        <div className="text-center">
          {getStatusIcon()}
          
          <h1 className="text-2xl font-bold text-white mb-4">
            {statusInfo.title}
          </h1>
          
          <p className="text-slate-300 mb-6 leading-relaxed">
            {statusInfo.description}
          </p>

          {/* Détails techniques */}
          <div className="bg-slate-700 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Status:</span>
              <span className={`text-sm font-mono ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                {status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            
            {reason && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">Raison:</span>
                <span className="text-sm font-mono text-slate-300">
                  {reason}
                </span>
              </div>
            )}
            
            {httpStatus && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">HTTP Status:</span>
                <span className="text-sm font-mono text-yellow-400">
                  {httpStatus}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Timestamp:</span>
              <span className="text-sm font-mono text-slate-300">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="text-slate-400 text-sm mb-4">
              Redirection automatique vers le dashboard dans {countdown}s...
            </div>
            
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                isSuccess 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSuccess ? 'Aller au dashboard' : 'Retour au dashboard'}
            </button>
            
            {!isSuccess && (
              <button
                onClick={() => window.location.href = '/auth/garmin/login?redirect=true'}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Réessayer la connexion Garmin
              </button>
            )}
          </div>

          {/* Debug info pour développement */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-slate-400 text-sm cursor-pointer hover:text-slate-300">
                Debug Info (dev only)
              </summary>
              <pre className="text-xs text-slate-500 mt-2 bg-slate-900 p-2 rounded overflow-auto">
                {JSON.stringify({
                  status,
                  reason,
                  message,
                  httpStatus,
                  timestamp: new Date().toISOString(),
                  userAgent: navigator.userAgent
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};
