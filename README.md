# 🏥 AVA Coach Santé IA

Une application de coaching santé intelligente avec IA intégrée pour un suivi personnalisé du bien-être.

## 🚀 Fonctionnalités

### ✨ **Interface IA Intelligente**
- Dashboard principal avec synthèse en langage naturel
- Chat IA pour conseils personnalisés
- Recommandations adaptées au profil utilisateur

### 📊 **Suivi Santé Complet**
- Monitoring du sommeil, stress, hydratation, énergie
- Objectifs personnalisables et gamification
- Historique et évolution des données

### 🍽️ **Analyse Nutritionnelle**
- Reconnaissance d'aliments par photo (API Spoonacular)
- Calcul automatique des valeurs nutritionnelles
- Conseils nutritionnels personnalisés

### 💪 **Planification d'Entraînement**
- Programmes adaptés au niveau d'abonnement
- Exercices personnalisés selon les objectifs

### 🎯 **Système d'Abonnements**
- **Explore** : Accès de base gratuit
- **Perform** : Fonctionnalités avancées (9,99€/mois)
- **Pro** : Programmes personnalisés (19,99€/mois)
- **Elite** : Coaching premium (29,99€/mois)

## 🛠️ Technologies

### Backend
- **Express.js** - Framework web
- **MongoDB** - Base de données
- **JWT** - Authentification
- **TensorFlow.js** - IA et reconnaissance d'images
- **Spoonacular API** - Données nutritionnelles

### Frontend
- **React 18** - Interface utilisateur
- **Vite** - Build tool moderne
- **Tailwind CSS** - Framework CSS
- **Axios** - Client HTTP
- **React Router** - Navigation

## 📦 Installation

### Prérequis
- Node.js (v16+)
- MongoDB
- npm ou yarn

### 1. Cloner le projet
```bash
git clone https://github.com/votre-username/ava-coach-sante.git
cd ava-coach-sante
```

### 2. Installation des dépendances
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configuration
Créer un fichier `.env` dans le dossier `backend` :
```env
PORT=5003
MONGODB_URI=mongodb://localhost:27017/coach_sante_db
SPOONACULAR_API_KEY=votre_cle_api_spoonacular
NODE_ENV=development
```

### 4. Démarrage
```bash
# Depuis la racine du projet
./start-app.sh
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend** : http://localhost:5003

## 👥 Comptes de Démonstration

### Thomas (Premium)
- **Email** : thomas@coach.com
- **Mot de passe** : motdepasse123
- **Profil** : Abonnement Pro, orienté force/musculation

### Sarah (Elite)
- **Email** : sarah@coach.com
- **Mot de passe** : motdepasse123
- **Profil** : Abonnement Elite, orientée bien-être/yoga

## 🚀 Utilisation

1. Accédez à http://localhost:5173
2. Cliquez sur un bouton de démonstration ou connectez-vous
3. Explorez le dashboard IA personnalisé
4. Testez l'analyse de repas par photo
5. Chattez avec l'IA pour des conseils santé

## 📁 Structure du Projet

```
coach-sante-app/
├── backend/                 # API Express.js
│   ├── src/
│   │   ├── api/            # Routes API
│   │   ├── models/         # Modèles MongoDB
│   │   └── middlewares/    # Middlewares
│   └── server.js           # Point d'entrée backend
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages principales
│   │   └── utils/          # Utilitaires
│   └── public/             # Assets statiques
├── start-app.sh           # Script de démarrage
├── stop-app.sh            # Script d'arrêt
└── README.md              # Documentation
```

## 🔧 Scripts Disponibles

- `./start-app.sh` - Démarre l'application complète
- `./stop-app.sh` - Arrête tous les services
- `npm run dev` - Mode développement (dans chaque dossier)
- `npm run build` - Build de production

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

Développé avec ❤️ pour révolutionner le coaching santé avec l'IA.

---

**🎯 AVA Coach Santé - Votre bien-être, notre priorité**
