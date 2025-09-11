import React, { useState, useEffect } from 'react';
import { LoadableButton } from '../common/SmartLoader';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        setIsInstalled(true);
      }
    };

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Empêcher l'affichage automatique du prompt
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Afficher notre prompt personnalisé après un délai
      setTimeout(() => {
        if (!isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
          setShowInstallPrompt(true);
        }
      }, 3000); // Attendre 3 secondes après le chargement
    };

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      console.log('PWA installée avec succès');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // Afficher notification de succès
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('AVA Coach installé !', {
          body: 'L\'application est maintenant disponible sur votre écran d\'accueil',
          icon: '/pwa-192x192.png'
        });
      }
    };

    checkInstallation();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsLoading(true);
    
    try {
      // Afficher le prompt d'installation
      deferredPrompt.prompt();
      
      // Attendre la réponse de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Utilisateur a accepté l\'installation');
      } else {
        console.log('Utilisateur a refusé l\'installation');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleRemindLater = () => {
    setShowInstallPrompt(false);
    // Redemander dans 24h
    localStorage.setItem('pwa-remind-later', Date.now().toString());
  };

  // Vérifier si on doit redemander plus tard
  useEffect(() => {
    const remindLater = localStorage.getItem('pwa-remind-later');
    if (remindLater) {
      const reminderTime = parseInt(remindLater);
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (now - reminderTime > oneDayInMs) {
        localStorage.removeItem('pwa-remind-later');
        localStorage.removeItem('pwa-install-dismissed');
      }
    }
  }, []);

  // Ne pas afficher si déjà installé ou pas de prompt disponible
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-4 shadow-2xl border border-blue-500/20 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">
              Installer AVA Coach
            </h3>
            <p className="text-blue-100 text-xs mt-1 leading-relaxed">
              Accédez rapidement à votre coach santé depuis votre écran d'accueil
            </p>
            
            <div className="flex gap-2 mt-3">
              <LoadableButton
                onClick={handleInstallClick}
                isLoading={isLoading}
                loadingText="Installation..."
                size="small"
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium text-xs px-3 py-1.5 rounded-lg"
              >
                Installer
              </LoadableButton>
              
              <button
                onClick={handleRemindLater}
                className="text-blue-100 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                Plus tard
              </button>
              
              <button
                onClick={handleDismiss}
                className="text-blue-100 hover:text-white p-1.5 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;