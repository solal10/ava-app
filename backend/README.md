# Backend - Coach Santé Intelligent

## Architecture

Le backend de l'application Coach Santé Intelligent est structuré selon une architecture modulaire basée sur Express.js et Node.js. Cette architecture permet une évolution facile et une intégration future avec différents SDK de montres connectées.

## Structure des dossiers

```
backend/
│
├── src/
│   ├── api/                  # Endpoints API
│   │   ├── user/             # Gestion des utilisateurs
│   │   ├── state/            # Données d'état de santé
│   │   └── ia/               # Logique du coach IA
│   │
│   ├── middlewares/          # Middlewares (auth, validation, etc.)
│   ├── models/               # Modèles de données
│   ├── config/               # Fichiers de configuration
│   └── utils/                # Utilitaires et fonctions partagées
│
├── tests/                    # Tests unitaires et d'intégration
├── server.js                 # Point d'entrée de l'application
└── package.json              # Dépendances et scripts
```

## API Endpoints

### `/api/user`
- **POST /register**: Créer un nouvel utilisateur
- **POST /login**: Authentifier un utilisateur
- **POST /test-login**: Login de test (pour simulation)
- **GET /profile**: Récupérer le profil de l'utilisateur
- **PUT /preferences**: Mettre à jour les préférences de l'utilisateur

### `/api/state`
- **GET /**: Récupérer les données d'état de santé de l'utilisateur
- **POST /update-from-sdk**: Endpoint pour recevoir les données des SDK (Garmin, Apple Watch, Suunto)

### `/api/ia`
- **POST /ask**: Poser une question au coach IA
- **POST /learn**: Fournir des données d'apprentissage pour améliorer l'IA

## Niveaux d'abonnement

L'application gère quatre niveaux d'abonnement avec des accès différents :
- **explore**: Accès limité aux fonctionnalités de base
- **perform**: Données additionnelles de fréquence cardiaque au repos
- **pro**: Accès aux données de niveau de stress
- **elite**: Accès complet incluant le score nutritionnel

## Installation

1. Cloner le dépôt
2. Installer les dépendances : `npm install`
3. Créer un fichier `.env` avec les variables d'environnement nécessaires (voir `.env.example`)
4. Démarrer le serveur : `npm run dev` (mode développement) ou `npm start` (production)

## Développement futur

Le backend est conçu pour être facilement étendu avec :
- Des bridges pour les SDK de montres connectées
- Une amélioration du système d'IA pour le coach
- Une gestion de paiements pour les abonnements
- Une base de données persistante (MongoDB est préconfiguré)
