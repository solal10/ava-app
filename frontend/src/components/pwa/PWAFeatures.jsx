import React, { useState, useEffect } from 'react';
import { LoadableButton } from '../common/SmartLoader';

const PWAFeatures = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [installationStatus, setInstallationStatus] = useState('not-installed');
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Gérer le statut de connexion
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier les permissions de notification
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Vérifier l'état d'installation
    const checkInstallationStatus = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        setInstallationStatus('installed');
      } else if ('serviceWorker' in navigator) {
        setInstallationStatus('service-worker-ready');
      }
    };

    checkInstallationStatus();

    // Écouter les mises à jour du service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          // Envoyer une notification de test
          new Notification('Notifications activées !', {
            body: 'Vous recevrez maintenant des rappels de santé personnalisés',
            icon: '/pwa-192x192.png',
            tag: 'notification-enabled',
            requireInteraction: false
          });
        }
      } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
      }
    }
  };

  const scheduleHealthReminder = () => {
    if (notificationPermission === 'granted') {
      // Programmer un rappel (simulé avec setTimeout pour la démo)
      setTimeout(() => {
        new Notification('💧 Rappel Hydratation', {
          body: 'Il est temps de boire un verre d\'eau !',
          icon: '/pwa-192x192.png',
          tag: 'hydration-reminder',
          actions: [
            { action: 'done', title: 'Fait !' },
            { action: 'later', title: 'Plus tard' }
          ]
        });
      }, 10000); // 10 secondes pour la démo
    }
  };

  const reloadForUpdate = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {/* Statut de connexion */}
      <div className={`p-3 rounded-lg border ${
        isOnline 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-orange-50 border-orange-200 text-orange-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <span className="text-sm font-medium">
            {isOnline ? 'En ligne' : 'Mode hors ligne'}
          </span>
        </div>
        <p className="text-xs mt-1 opacity-75">
          {isOnline 
            ? 'Toutes les fonctionnalités sont disponibles'
            : 'Fonctionnalités de base disponibles hors ligne'
          }
        </p>
      </div>

      {/* État d'installation */}
      <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-blue-800">
            {installationStatus === 'installed' ? 'Application installée' : 
             installationStatus === 'service-worker-ready' ? 'Prêt pour installation' : 
             'Installation non disponible'}
          </span>
        </div>
      </div>

      {/* Mise à jour disponible */}
      {updateAvailable && (
        <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium text-purple-800">
                Mise à jour disponible
              </span>
            </div>
            <LoadableButton
              onClick={reloadForUpdate}
              size="small"
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1"
            >
              Mettre à jour
            </LoadableButton>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.07 14C10.25 13.09 10.5 12.2 10.81 11.37C9.75 10.81 8.5 10.5 7.13 10.5C5.76 10.5 4.51 10.81 3.45 11.37C3.76 12.2 4.01 13.09 4.19 14H10.07zM12 3L14.39 8.56C13.71 8.7 13.08 8.91 12.5 9.18C11.92 8.91 11.29 8.7 10.61 8.56L12 3z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">
              Notifications de santé
            </span>
          </div>
          
          {notificationPermission === 'default' && (
            <LoadableButton
              onClick={requestNotificationPermission}
              size="small"
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-3 py-1"
            >
              Activer
            </LoadableButton>
          )}
        </div>

        <div className="text-xs text-slate-500">
          {notificationPermission === 'granted' ? (
            <span className="text-green-600">✓ Notifications activées</span>
          ) : notificationPermission === 'denied' ? (
            <span className="text-red-600">✗ Notifications bloquées</span>
          ) : (
            <span>Notifications non configurées</span>
          )}
        </div>

        {notificationPermission === 'granted' && (
          <LoadableButton
            onClick={scheduleHealthReminder}
            size="small"
            variant="outline"
            className="text-xs px-3 py-1 border border-cyan-600 text-cyan-600 hover:bg-cyan-50"
          >
            Test de rappel (10s)
          </LoadableButton>
        )}
      </div>

      {/* Fonctionnalités PWA */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-1 text-slate-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <span>Cache intelligent</span>
          </div>
          <p className="text-slate-500 mt-1">Accès rapide même hors ligne</p>
        </div>
        
        <div className="p-2 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-1 text-slate-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Installation native</span>
          </div>
          <p className="text-slate-500 mt-1">Comme une app mobile</p>
        </div>
      </div>
    </div>
  );
};

export default PWAFeatures;