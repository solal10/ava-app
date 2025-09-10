# 🏋️‍♀️ AVA Coach Santé IA - MVP

> Application de coaching santé intelligente avec suivi personnalisé

## ✨ Aperçu du Projet

AVA Coach Santé IA est une application full-stack moderne qui combine React, Express.js et MongoDB pour offrir une expérience de coaching santé personnalisée avec des fonctionnalités d'IA.

### 🎯 Statut MVP
- ✅ **Architecture restructurée** - Séparation claire frontend/backend
- ✅ **Sécurité renforcée** - Authentification JWT, rate limiting, validation
- ✅ **Gestion d'erreurs robuste** - Logging, error boundaries
- ✅ **Tests automatisés** - Tests unitaires et d'intégration
- ✅ **Build fonctionnel** - Prêt pour le déploiement

## 🛠 Stack Technique

### Frontend (React + Vite)
- **React 18** avec hooks modernes
- **Vite** pour un build rapide
- **Tailwind CSS** pour le styling
- **React Router** pour la navigation
- **Axios** pour les appels API
- **Gestion d'état** avec Context API

### Backend (Express.js + MongoDB)
- **Express.js** avec middleware personnalisés
- **MongoDB** avec Mongoose ODM
- **JWT** pour l'authentification
- **Rate limiting** intégré
- **Validation** avec express-validator
- **Tests** avec Jest et Supertest

## 🚀 Installation Rapide

### Prérequis
- Node.js 16+
- MongoDB 4.4+
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone <url-du-repo>
cd ava-app-main

# Installation complète (recommandé)
npm run install:all

# Ou installation manuelle
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Configuration
```bash
# Copier les fichiers d'environnement
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Éditer les variables d'environnement nécessaires
```

## 🏃‍♂️ Démarrage

### Développement
```bash
# Démarrer frontend + backend simultanément
npm run dev

# Ou séparément
npm run dev:frontend  # Port 5173
npm run dev:backend   # Port 5003
```

### Production
```bash
# Build du frontend
npm run build:frontend

# Démarrage production
npm run start:backend
```

### Tests
```bash
# Tests backend uniquement
cd backend && npm test

# Tests avec coverage
cd backend && npm run test:coverage
```

## 📁 Structure du Projet

```
ava-app-main/
├── 📱 frontend/           # Application React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/        # Pages principales
│   │   ├── utils/        # Utilitaires et API
│   │   ├── config/       # Configuration centralisée
│   │   └── contexts/     # Contexts React
│   ├── public/           # Assets statiques
│   └── package.json
│
├── 🔧 backend/            # API Express.js
│   ├── src/
│   │   ├── api/          # Routes par domaine
│   │   ├── models/       # Modèles MongoDB
│   │   ├── middlewares/  # Middleware personnalisés
│   │   └── services/     # Services métier
│   ├── tests/            # Tests automatisés
│   └── server.js         # Point d'entrée
│
└── 📚 Documentation
```

## 🔐 Sécurité

### Fonctionnalités Implémentées
- **Authentification JWT** avec expiration configurable
- **Rate limiting** par IP (configurable par route)
- **Validation stricte** des données d'entrée
- **Hashage sécurisé** des mots de passe (bcrypt)
- **CORS configuré** pour les domaines autorisés
- **Headers de sécurité** automatiques

### Niveaux d'Abonnement
- **Explore** (gratuit) - Fonctionnalités de base
- **Perform** - Suivi avancé
- **Pro** - IA et analytics
- **Elite** - Accès complet

## 🔌 API Endpoints

### Authentification
```http
POST /api/user/register  # Inscription
POST /api/user/login     # Connexion
GET  /api/user/profile   # Profil utilisateur (protégé)
```

### Données Santé
```http
POST /api/health         # Sauvegarder données santé
GET  /api/health         # Récupérer données santé
```

### Abonnements
```http
GET  /api/subscription   # Statut abonnement
POST /api/subscription/upgrade  # Upgrade abonnement
```

## 🧪 Tests

### Coverage Actuel
- **Authentification** : Tests complets (register, login, JWT)
- **Routes protégées** : Validation middleware
- **Données santé** : CRUD operations
- **Rate limiting** : Tests de performance

### Lancer les Tests
```bash
cd backend
npm test              # Tests standards
npm run test:watch    # Mode watch
npm run test:coverage # Avec rapport de couverture
```

## 🚨 Troubleshooting

### Problèmes Courants

#### Build Frontend Échoue
```bash
# Vérifier les dépendances
cd frontend && npm install

# Nettoyer et reconstruire
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Backend ne Démarre Pas
```bash
# Vérifier MongoDB
mongod --version

# Vérifier les variables d'environnement
cat backend/.env

# Vérifier les ports
lsof -i :5003
```

#### Tests Échouent
```bash
# Vérifier la base de données de test
mongosh ava-app-test

# Réinstaller les dépendances de test
cd backend
npm install --save-dev
```

## 🛣 Roadmap Post-MVP

### Phase 1 - Stabilisation
- [ ] Monitoring et logging avancés
- [ ] Tests end-to-end (Playwright/Cypress)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Documentation API (Swagger)

### Phase 2 - Fonctionnalités
- [ ] Reconnaissance alimentaire (TensorFlow.js)
- [ ] Intégration Garmin/Fitbit
- [ ] Notifications push
- [ ] Export de données

### Phase 3 - Scale
- [ ] Déploiement Kubernetes
- [ ] Cache Redis
- [ ] CDN pour les assets
- [ ] Monitoring APM

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Support

- **Documentation** : Voir les fichiers `/docs`
- **Issues** : GitHub Issues
- **Wiki** : GitHub Wiki

---

**État du projet** : ✅ MVP Fonctionnel
**Dernière mise à jour** : Septembre 2024
**Version** : 1.0.0