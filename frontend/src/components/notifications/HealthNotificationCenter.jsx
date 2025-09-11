import React, { useState } from 'react';
import useHealthNotifications from '../../hooks/useHealthNotifications';
import { LoadableButton } from '../common/SmartLoader';

const HealthNotificationCenter = ({ compact = false }) => {
  const {
    notificationPermission,
    requestNotificationPermission,
    scheduleHydrationReminder,
    scheduleExerciseReminder,
    scheduleMealReminder,
    showSuccessNotification,
    showMotivationNotification
  } = useHealthNotifications();

  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      await requestNotificationPermission();
    } finally {
      setIsRequestingPermission(false);
    }
  };

  if (compact) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-100">Rappels Santé</h3>
          <div className={`w-2 h-2 rounded-full ${
            notificationPermission === 'granted' ? 'bg-green-500' : 'bg-orange-500'
          }`}></div>
        </div>
        
        {notificationPermission === 'granted' ? (
          <div className="space-y-2">
            <button
              onClick={() => scheduleHydrationReminder(60)}
              className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              💧 Rappel hydratation (1h)
            </button>
            <button
              onClick={() => scheduleExerciseReminder('09:00')}
              className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              🏃‍♀️ Rappel exercice (9h)
            </button>
            <button
              onClick={() => showMotivationNotification()}
              className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              ⭐ Message motivation
            </button>
          </div>
        ) : (
          <LoadableButton
            onClick={handleRequestPermission}
            isLoading={isRequestingPermission}
            loadingText="Activation..."
            size="small"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2"
          >
            Activer les rappels
          </LoadableButton>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Statut des notifications */}
      <div className={`p-4 rounded-xl border ${
        notificationPermission === 'granted'
          ? 'bg-green-900/20 border-green-500/30'
          : notificationPermission === 'denied'
          ? 'bg-red-900/20 border-red-500/30'
          : 'bg-yellow-900/20 border-yellow-500/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            notificationPermission === 'granted' ? 'bg-green-500' :
            notificationPermission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <div>
            <h3 className={`font-semibold ${
              notificationPermission === 'granted' ? 'text-green-400' :
              notificationPermission === 'denied' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {notificationPermission === 'granted' ? 'Notifications activées' :
               notificationPermission === 'denied' ? 'Notifications bloquées' :
               'Notifications non configurées'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {notificationPermission === 'granted' 
                ? 'Vous recevrez des rappels personnalisés pour vos objectifs santé'
                : notificationPermission === 'denied'
                ? 'Activez les notifications dans les paramètres du navigateur'
                : 'Activez les notifications pour recevoir des rappels utiles'
              }
            </p>
          </div>
        </div>
        
        {notificationPermission === 'default' && (
          <LoadableButton
            onClick={handleRequestPermission}
            isLoading={isRequestingPermission}
            loadingText="Activation..."
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          >
            Activer les notifications
          </LoadableButton>
        )}
      </div>

      {/* Raccourcis de notifications si activées */}
      {notificationPermission === 'granted' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Rappels d'hydratation */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">💧</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Hydratation</h3>
                <p className="text-xs text-slate-400">Rappels réguliers</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => scheduleHydrationReminder(30)}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Dans 30 minutes
              </button>
              <button
                onClick={() => scheduleHydrationReminder(60)}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Dans 1 heure
              </button>
              <button
                onClick={() => scheduleHydrationReminder(120)}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Dans 2 heures
              </button>
            </div>
          </div>

          {/* Rappels d'exercice */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏃‍♀️</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Exercice</h3>
                <p className="text-xs text-slate-400">Rappels quotidiens</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => scheduleExerciseReminder('09:00')}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Demain à 9h00
              </button>
              <button
                onClick={() => scheduleExerciseReminder('18:00')}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Demain à 18h00
              </button>
              <button
                onClick={() => scheduleExerciseReminder('20:00')}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Demain à 20h00
              </button>
            </div>
          </div>

          {/* Rappels de repas */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🍎</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Repas</h3>
                <p className="text-xs text-slate-400">Rappels photo</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => scheduleMealReminder('breakfast')}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Petit-déjeuner (8h)
              </button>
              <button
                onClick={() => scheduleMealReminder('lunch')}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Déjeuner (12h30)
              </button>
              <button
                onClick={() => scheduleMealReminder('dinner')}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Dîner (19h)
              </button>
            </div>
          </div>

          {/* Messages de motivation */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">⭐</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Motivation</h3>
                <p className="text-xs text-slate-400">Messages inspirants</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => showMotivationNotification()}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Message du jour
              </button>
              <button
                onClick={() => showSuccessNotification('daily-goal')}
                className="w-full text-left p-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Test félicitations
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default HealthNotificationCenter;