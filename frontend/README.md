# Frontend - Coach Santé Intelligent

## Architecture

Le frontend de l'application Coach Santé Intelligent est construit avec React et Tailwind CSS. Cette architecture permet une interface utilisateur moderne, réactive et facilement personnalisable.

## Structure des dossiers

```
frontend/
│
├── src/
│   ├── components/           # Composants React
│   │   ├── home/             # Page d'accueil et affichage de l'état
│   │   ├── chat/             # Interface du chat avec l'IA
│   │   ├── navbar/           # Barre de navigation
│   │   ├── auth/             # Authentification et sélection d'abonnement
│   │   └── ...               # Autres composants
│   │
│   ├── utils/                # Utilitaires et helpers
│   ├── hooks/                # Hooks personnalisés React
│   ├── contexts/             # Contextes React (pour état global)
│   ├── assets/               # Images, icônes, etc.
│   │
│   ├── App.js                # Composant racine
│   └── index.js              # Point d'entrée de l'application
│
├── public/                   # Fichiers statiques
└── package.json              # Dépendances et scripts
```

## Composants principaux

### `Home.jsx`
- Affichage de l'état de santé quotidien de l'utilisateur
- Visualisation des différentes métriques (batterie corporelle, sommeil, etc.)
- Gestion de la visibilité des indicateurs selon le niveau d'abonnement

### `ChatIA.jsx`
- Interface de discussion avec l'IA coach santé
- Limitation du nombre de questions pour le niveau "explore" (3 par semaine)
- Affichage des messages utilisateur et réponses de l'IA

### `NavBar.jsx`
- Barre de navigation avec 6 onglets principaux
- Affichage adaptatif pour mobile et desktop
- Indication du niveau d'abonnement actuel

### `AuthPage.jsx`
- Page de connexion utilisateur
- Simulateur de niveau d'abonnement pour les tests
- Présentation des différentes offres d'abonnement

## Gestion des abonnements

L'application propose quatre niveaux d'abonnement qui déterminent l'accès aux fonctionnalités :

1. **Explore** (gratuit)
   - Accès limité aux fonctionnalités de base
   - 3 questions par semaine à l'IA

2. **Perform** (payant)
   - Inclut les fonctionnalités d'Explore
   - Questions illimitées à l'IA
   - Accès aux données de fréquence cardiaque au repos

3. **Pro** (payant)
   - Inclut les fonctionnalités de Perform
   - Accès aux données de niveau de stress
   - Programmes d'entraînement personnalisés

4. **Elite** (payant)
   - Accès complet à toutes les fonctionnalités
   - Score nutritionnel
   - Consultation personnelle avec un coach

Un utilitaire `subscriptionUtils.js` centralise la logique d'accès aux fonctionnalités selon le niveau d'abonnement.

## Installation et lancement

1. Installer les dépendances : `npm install`
2. Démarrer le serveur de développement : `npm start`
3. L'application sera accessible à l'adresse : `http://localhost:3000`

## Extensions futures

Le frontend est conçu pour accueillir facilement de nouvelles fonctionnalités :
- Intégration avec les SDK des montres connectées
- Module d'analyse de photos des repas
- Tableaux de bord avancés pour le suivi de la progression
