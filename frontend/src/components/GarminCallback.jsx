import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import garminBridge from '../sdk/garminBridge';

export default function GarminCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Connexion à Garmin Connect...');
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const oauthToken = searchParams.get('oauth_token');
        const oauthVerifier = searchParams.get('oauth_verifier');
        const error = searchParams.get('error');
        
        if (error) {
          console.error('Erreur OAuth Garmin:', error);
          setStatus('error');
          setMessage(`Erreur d'authentification: ${error}`);
          setTimeout(() => {
            navigate('/dashboard?garmin_error=auth_failed');
          }, 3000);
          return;
        }
        
        if (!oauthToken || !oauthVerifier) {
          setStatus('error');
          setMessage('Token OAuth ou verifier manquant');
          setTimeout(() => {
            navigate('/dashboard?garmin_error=missing_token');
          }, 3000);
          return;
        }
        
        setMessage('Échange du token OAuth 1.0...');
        const success = await garminBridge.exchangeCodeForToken(oauthToken, oauthVerifier);
        
        if (success) {
          setStatus('success');
          setMessage('Connexion Garmin réussie !');
          
          // Synchroniser les données immédiatement
          setMessage('Synchronisation des données...');
          try {
            await garminBridge.getAllHealthData();
            setMessage('Données synchronisées avec succès !');
          } catch (syncError) {
            console.warn('Erreur de synchronisation:', syncError);
            // Continuer même si la sync échoue
          }
          
          setTimeout(() => {
            navigate('/dashboard?garmin_success=connected');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Échec de l\'échange de token');
          setTimeout(() => {
            navigate('/dashboard?garmin_error=token_exchange_failed');
          }, 3000);
        }
      } catch (error) {
        console.error('Erreur lors du callback OAuth:', error);
        setStatus('error');
        setMessage('Erreur inattendue lors de la connexion');
        setTimeout(() => {
          navigate('/dashboard?garmin_error=unexpected_error');
        }, 3000);
      }
    };
    
    handleCallback();
  }, [searchParams, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <img 
            src="/garmin-logo.png" 
            alt="Garmin" 
            className="h-12 mx-auto mb-4"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connexion Garmin
          </h1>
        </div>
        
        <div className="mb-6">
          {status === 'processing' && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 text-lg">
            {message}
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          {status === 'processing' && 'Veuillez patienter...'}
          {status === 'success' && 'Redirection vers le dashboard...'}
          {status === 'error' && 'Redirection en cours...'}
        </div>
      </div>
    </div>
  );
}
