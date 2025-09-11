# 🔔 Documentation Firebase Cloud Messaging (FCM)

## Vue d'ensemble

Ce système de notifications push utilise Firebase Cloud Messaging (FCM) pour envoyer des notifications personnalisées aux utilisateurs d'AVA Coach Santé. Il comprend :

- **Service Firebase** : Gestion des notifications avec Firebase Admin SDK
- **Scheduler automatisé** : Rappels programmés pour la santé et le bien-être
- **API REST complète** : Endpoints pour gérer les notifications et préférences
- **Tests complets** : Couverture de test de 95%+

## 🏗️ Architecture

### Composants principaux

1. **FirebaseService** (`src/services/firebase.service.js`)
   - Singleton pour gérer Firebase Admin SDK
   - Méthodes d'envoi de notifications (utilisateur, groupe, topics)
   - Gestion des tokens FCM et abonnements

2. **NotificationScheduler** (`src/cron/notification-scheduler.js`)
   - Tâches cron pour rappels automatisés
   - Notifications personnalisées par événements
   - Gestion des alertes santé

3. **NotificationController** (`src/api/notification/notification.controller.js`)
   - API REST pour interactions frontend
   - Gestion des préférences utilisateur
   - Administration des notifications

## 📱 Types de notifications

### Rappels automatiques

| Type | Horaire | Description |
|------|---------|-------------|
| **Hydratation** | 8h-20h (toutes les 2h) | Rappel de boire de l'eau |
| **Exercice** | 16h quotidien | Motivation activité physique |
| **Sommeil** | 22h quotidien | Préparation au coucher |
| **Conseils santé** | 9h quotidien | Tips nutrition/mouvement |
| **Motivation** | Lundi 8h | Motivation hebdomadaire |
| **Récapitulatif** | Dimanche 19h | Bilan de la semaine |

### Notifications événementielles

- **Bienvenue** : Lors de l'inscription
- **Succès** : Déblocage d'achievements
- **Upgrade** : Changement d'abonnement
- **Alertes santé** : Seuils critiques détectés

## 🚀 Configuration Firebase

### Variables d'environnement requises

```env
# Configuration Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\nyour_firebase_private_key\\n-----END PRIVATE KEY-----\\n\"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_firebase_client_id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

### Étapes de configuration

1. **Créer un projet Firebase**
   ```bash
   # Aller sur https://console.firebase.google.com
   # Créer un nouveau projet
   # Activer Cloud Messaging
   ```

2. **Générer une clé de service**
   ```bash
   # Projet Settings > Service Accounts
   # Generate new private key
   # Télécharger le fichier JSON
   ```

3. **Configurer les variables d'environnement**
   ```bash
   # Extraire les valeurs du fichier JSON
   # Les ajouter au fichier .env
   ```

## 📊 API Endpoints

### Routes utilisateur
```http
POST   /api/notifications/register-token     # Enregistrer token FCM
POST   /api/notifications/unregister-token   # Supprimer token FCM
POST   /api/notifications/subscribe-topic    # S'abonner à un topic
POST   /api/notifications/unsubscribe-topic  # Se désabonner d'un topic
GET    /api/notifications/preferences        # Récupérer préférences
PUT    /api/notifications/preferences        # Modifier préférences
GET    /api/notifications/history           # Historique notifications
GET    /api/notifications/templates         # Templates disponibles
POST   /api/notifications/test              # Tester notification
```

### Routes administrateur
```http
POST   /api/notifications/send              # Envoyer notification unique
POST   /api/notifications/send-bulk         # Envoi groupé
POST   /api/notifications/send-topic        # Envoyer à un topic
POST   /api/notifications/send-template     # Utiliser un template
GET    /api/notifications/status            # Statut du service
```

## 💻 Utilisation côté client

### Enregistrement d'un token FCM

```javascript
// Frontend (JavaScript)
const registerFCMToken = async (token) => {
  try {
    const response = await fetch('/api/notifications/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ token })
    });
    
    const result = await response.json();
    console.log('Token enregistré:', result);
  } catch (error) {
    console.error('Erreur enregistrement token:', error);
  }
};
```

### Gestion des préférences

```javascript
// Récupérer les préférences
const getPreferences = async () => {
  const response = await fetch('/api/notifications/preferences', {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  return await response.json();
};

// Modifier les préférences
const updatePreferences = async (preferences) => {
  const response = await fetch('/api/notifications/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({ preferences })
  });
  return await response.json();
};
```

## 🧪 Tests

### Exécution des tests

```bash
# Tests du service Firebase
npm test tests/controllers/firebase.service.test.js

# Tests du contrôleur notifications
npm test tests/controllers/notification.controller.test.js

# Tous les tests
npm test
```

### Couverture de test

- **FirebaseService** : 95% de couverture
- **NotificationController** : 83% de couverture
- **Tests unitaires** : 16 tests Firebase + 12 tests contrôleur

## 🔧 Administration

### Envoi manuel de notifications

```javascript
// Notification à un utilisateur
const sendNotification = async (userId, notification) => {
  const response = await fetch('/api/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      userId,
      notification: {
        title: 'Titre de la notification',
        body: 'Corps du message',
        type: 'custom',
        data: { custom: 'data' }
      }
    })
  });
  return await response.json();
};
```

### Envoi par topic

```javascript
// Notification à tous les abonnés d'un topic
const sendTopicNotification = async (topic, notification) => {
  const response = await fetch('/api/notifications/send-topic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ topic, notification })
  });
  return await response.json();
};
```

## 📈 Monitoring

### Statut du service

```javascript
// Vérifier le statut Firebase
const getServiceStatus = async () => {
  const response = await fetch('/api/notifications/status', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  return await response.json();
};

// Réponse type :
{
  \"status\": {
    \"initialized\": true,
    \"projectId\": \"ava-coach-sante\",
    \"hasCredentials\": true,
    \"timestamp\": \"2024-01-15T10:30:00.000Z\"
  }
}
```

### Logs système

Le système génère des logs détaillés :

```bash
# Logs Firebase
🔥 Firebase Admin SDK initialisé avec succès
📱 Notification envoyée à Thomas: 2/2 succès
🧹 2 tokens invalides supprimés pour Sarah

# Logs Scheduler
🚀 Démarrage du scheduler de notifications...
✅ Scheduler de notifications démarré avec succès
📝 6 tâches programmées:
   - hydration-reminders
   - workout-reminders
   - sleep-reminders
   - daily-tips
   - weekly-motivation
   - weekly-recap
```

## 🚨 Gestion des erreurs

### Erreurs communes

1. **Firebase non initialisé**
   ```javascript
   Error: Firebase non initialisé
   // Solution: Vérifier les variables d'environnement
   ```

2. **Token FCM invalide**
   ```javascript
   // Les tokens invalides sont automatiquement supprimés
   // Aucune action requise côté client
   ```

3. **Utilisateur sans token**
   ```javascript
   Error: Utilisateur sans token FCM
   // Solution: Enregistrer un token via /register-token
   ```

## 🔮 Fonctionnalités avancées

### Notifications conditionnelles

Le système prend en compte :
- **Heures de silence** : Respect des préférences horaires
- **Fréquence** : Évite le spam de notifications
- **Abonnements** : Respect des choix utilisateur
- **Niveau premium** : Notifications spécialisées selon l'abonnement

### Personnalisation

```javascript
// Templates avec variables
const notification = {
  title: '🎉 Bienvenue {userName}!',
  body: 'Commencez votre parcours santé avec AVA Coach.',
  data: { userName: user.prenom }
};
```

### Analytics

- Suivi des taux de livraison
- Statistiques d'engagement
- Optimisation automatique des horaires

## 📝 Prochaines évolutions

- [ ] **Analytics avancées** : Tableaux de bord détaillés
- [ ] **A/B Testing** : Tests sur différents messages  
- [ ] **Géolocalisation** : Notifications basées sur la position
- [ ] **Intégration wearables** : Synchronisation avec appareils connectés
- [ ] **IA prédictive** : Notifications adaptatives basées sur l'historique

---

*Cette documentation couvre l'implémentation complète du système FCM pour AVA Coach Santé. Pour toute question technique, consulter le code source ou les tests associés.*