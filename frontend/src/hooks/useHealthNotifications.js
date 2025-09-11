import { useState, useEffect, useCallback } from 'react';

export const useHealthNotifications = () => {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    // Vérifier la permission de notification
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Vérifier si le service worker est disponible
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsServiceWorkerReady(true);
      });
    }
  }, []);

  // Demander la permission pour les notifications
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        return permission;
      } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
        return 'denied';
      }
    }
    return 'denied';
  }, []);

  // Envoyer une notification immédiate
  const showNotification = useCallback((title, options = {}) => {
    if (notificationPermission === 'granted') {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      });

      // Auto-fermer après 5 secondes si pas d'interaction
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  }, [notificationPermission]);

  // Programmer une notification via le service worker
  const scheduleNotification = useCallback((type, delayMs) => {
    if (isServiceWorkerReady && 'serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        tag: type,
        delay: delayMs
      });
    }
  }, [isServiceWorkerReady]);

  // Notifications prédéfinies pour la santé
  const healthNotifications = {
    // Rappels d'hydratation
    scheduleHydrationReminder: useCallback((intervalMinutes = 60) => {
      const delayMs = intervalMinutes * 60 * 1000;
      scheduleNotification('hydration-reminder', delayMs);
    }, [scheduleNotification]),

    // Rappels d'exercice
    scheduleExerciseReminder: useCallback((timeString = '09:00') => {
      const [hours, minutes] = timeString.split(':').map(Number);
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);
      
      // Si l'heure est passée aujourd'hui, programmer pour demain
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      const delayMs = targetTime.getTime() - now.getTime();
      scheduleNotification('exercise-reminder', delayMs);
    }, [scheduleNotification]),

    // Rappels de repas
    scheduleMealReminder: useCallback((mealType = 'lunch') => {
      const mealTimes = {
        breakfast: '08:00',
        lunch: '12:30',
        dinner: '19:00'
      };
      
      const timeString = mealTimes[mealType] || mealTimes.lunch;
      const [hours, minutes] = timeString.split(':').map(Number);
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);
      
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      const delayMs = targetTime.getTime() - now.getTime();
      scheduleNotification('meal-reminder', delayMs);
    }, [scheduleNotification]),

    // Notification de félicitations
    showSuccessNotification: useCallback((achievement) => {
      const messages = {
        'daily-goal': 'Objectif quotidien atteint ! 🎉',
        'streak-7': 'Série de 7 jours ! Incroyable ! 🔥',
        'hydration': 'Objectif hydration atteint ! 💧',
        'exercise': 'Séance d\'entraînement terminée ! 💪',
        'weight-goal': 'Objectif de poids atteint ! 🎯'
      };

      showNotification(messages[achievement] || 'Bravo !', {
        body: 'Continuez sur cette lancée !',
        tag: `success-${achievement}`,
        requireInteraction: false
      });
    }, [showNotification]),

    // Notification de motivation
    showMotivationNotification: useCallback(() => {
      const motivationalMessages = [
        'Vous êtes plus fort que vos excuses ! 💪',
        'Chaque petit pas compte ! 🚶‍♀️',
        'Votre santé mérite cet effort ! ❤️',
        'Restez concentré sur vos objectifs ! 🎯',
        'Vous faites déjà mieux qu\'hier ! ⭐'
      ];

      const randomMessage = motivationalMessages[
        Math.floor(Math.random() * motivationalMessages.length)
      ];

      showNotification('💡 Motivation du jour', {
        body: randomMessage,
        tag: 'motivation',
        requireInteraction: false
      });
    }, [showNotification])
  };

  return {
    notificationPermission,
    isServiceWorkerReady,
    requestNotificationPermission,
    showNotification,
    scheduleNotification,
    ...healthNotifications
  };
};

export default useHealthNotifications;