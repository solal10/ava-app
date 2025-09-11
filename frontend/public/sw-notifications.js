// Service Worker personnalisé pour les notifications de santé
// Ce fichier gère les notifications push et les rappels personnalisés

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('SW Notifications: Installation');
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('SW Notifications: Activation');
  event.waitUntil(self.clients.claim());
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('SW Notifications: Click sur notification', event.notification.tag);
  
  event.notification.close();
  
  // Gérer les actions des notifications
  const action = event.action;
  const tag = event.notification.tag;
  
  if (action === 'done' && tag === 'hydration-reminder') {
    // Marquer l'hydration comme faite
    console.log('Hydration marquée comme faite');
  } else if (action === 'later' && tag === 'hydration-reminder') {
    // Programmer un nouveau rappel dans 30 minutes
    scheduleNotification('hydration-reminder', 30 * 60 * 1000);
  }
  
  // Ouvrir l'application
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clients) => {
      // Si l'app est déjà ouverte, la focus
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      return self.clients.openWindow('/');
    })
  );
});

// Gestion des notifications push (si backend configuré)
self.addEventListener('push', (event) => {
  console.log('SW Notifications: Réception push', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Fonction utilitaire pour programmer des notifications locales
function scheduleNotification(tag, delay) {
  setTimeout(() => {
    const notifications = {
      'hydration-reminder': {
        title: '💧 Rappel Hydratation',
        body: 'Il est temps de boire un verre d\'eau !',
        actions: [
          { action: 'done', title: 'Fait !' },
          { action: 'later', title: 'Plus tard' }
        ]
      },
      'exercise-reminder': {
        title: '🏃‍♀️ Temps d\'exercice',
        body: 'Votre séance d\'entraînement vous attend !',
        actions: [
          { action: 'start', title: 'Commencer' },
          { action: 'snooze', title: '10 min' }
        ]
      },
      'meal-reminder': {
        title: '🍎 Rappel repas',
        body: 'N\'oubliez pas de photographier votre repas !',
        actions: [
          { action: 'photo', title: 'Prendre photo' },
          { action: 'later', title: 'Plus tard' }
        ]
      }
    };
    
    const notification = notifications[tag];
    if (notification) {
      self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: '/pwa-192x192.png',
        tag: tag,
        actions: notification.actions,
        requireInteraction: true
      });
    }
  }, delay);
}

// Écouter les messages depuis l'application principale
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { tag, delay } = event.data;
    scheduleNotification(tag, delay);
  }
});