// Nom du fichier : seedMongoDB.js
// 📍 Script de seed pour injecter des données de test dans MongoDB

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import des modèles (à adapter selon votre structure)
// Note: Vous devrez peut-être ajuster les imports selon vos modèles existants

dotenv.config();

// Connexion à MongoDB
console.log("🔗 Connexion à MongoDB...");
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coach-sante');
console.log("✅ Connexion MongoDB établie");

// Définition des schémas temporaires pour le seed (à adapter)
const UserSchema = new mongoose.Schema({
  prenom: String,
  nom: String,
  email: String,
  password: String,
  isPremium: { type: Boolean, default: false },
  stats: {
    sommeil: Number,
    stress: Number,
    hydratation: Number,
    energie: Number,
    activite: Number
  },
  objectifs: {
    sommeil: Number,
    stress: Number,
    hydratation: Number,
    energie: Number,
    activite: Number
  },
  createdAt: { type: Date, default: Date.now }
});

const MealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  calories: Number,
  proteines: Number,
  glucides: Number,
  lipides: Number,
  imageName: String,
  date: { type: Date, default: Date.now }
});

const HealthSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
  sommeil: Number,
  stress: Number,
  hydratation: Number,
  energie: Number,
  activite: Number,
  score: Number
});

const LearnSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  context: String,
  result: String,
  timestamp: { type: Date, default: Date.now }
});

// Création des modèles
const User = mongoose.model('User', UserSchema);
const Meal = mongoose.model('Meal', MealSchema);
const Health = mongoose.model('Health', HealthSchema);
const Learn = mongoose.model('Learn', LearnSchema);

// Nettoyage des données existantes
console.log("🧹 Suppression des données précédentes...");
await User.deleteMany({});
await Meal.deleteMany({});
await Health.deleteMany({});
await Learn.deleteMany({});
console.log("✅ Données précédentes supprimées");

// Hash des mots de passe (version simplifiée pour les tests)
const hashPassword = async (password) => {
  return password; // Pour les tests, on garde le mot de passe en clair
};

console.log("👤 Création des utilisateurs de test...");

// 🔹 Utilisateur 1 : Thomas Premium (pour les tests)
const userThomas = await User.create({
  prenom: "Thomas",
  nom: "Benichou",
  email: "thomas@coach.com",
  password: await hashPassword("motdepasse123"),
  isPremium: true,
  stats: { 
    sommeil: 7.8, 
    stress: 2, 
    hydratation: 2.5, 
    energie: 85, 
    activite: 9400 
  },
  objectifs: { 
    sommeil: 8, 
    stress: 1, 
    hydratation: 3, 
    energie: 90, 
    activite: 10000 
  }
});

// 🔹 Utilisateur 2 : Sarah (Gratuit)
const userSarah = await User.create({
  prenom: "Sarah",
  nom: "Martin",
  email: "sarah@coach.com",
  password: await hashPassword("motdepasse123"),
  isPremium: false,
  stats: { 
    sommeil: 6.2, 
    stress: 3, 
    hydratation: 1.8, 
    energie: 65, 
    activite: 6000 
  },
  objectifs: { 
    sommeil: 7, 
    stress: 2, 
    hydratation: 2.5, 
    energie: 75, 
    activite: 8000 
  }
});

// 🔹 Utilisateur 3 : Maxime (Premium)
const userMaxime = await User.create({
  prenom: "Maxime",
  nom: "Dupont",
  email: "maxime@coach.com",
  password: await hashPassword("motdepasse123"),
  isPremium: true,
  stats: { 
    sommeil: 8.5, 
    stress: 1, 
    hydratation: 3.1, 
    energie: 92, 
    activite: 10500 
  },
  objectifs: { 
    sommeil: 8, 
    stress: 1, 
    hydratation: 3, 
    energie: 90, 
    activite: 10000 
  }
});

// 🔹 Utilisateur de test pour l'audit
const testUser = await User.create({
  prenom: "Test",
  nom: "User",
  email: "testuser@example.com",
  password: await hashPassword("motdepasse"),
  isPremium: false,
  stats: { 
    sommeil: 7.0, 
    stress: 2, 
    hydratation: 2.0, 
    energie: 75, 
    activite: 8000 
  },
  objectifs: { 
    sommeil: 8, 
    stress: 1, 
    hydratation: 2.5, 
    energie: 80, 
    activite: 9000 
  }
});

console.log("✅ Utilisateurs créés avec succès");

console.log("🍽️ Création des données de repas...");

// 🍽️ Repas pour Thomas
await Meal.insertMany([
  {
    userId: userThomas._id,
    type: "petit-déjeuner",
    calories: 420,
    proteines: 18,
    glucides: 45,
    lipides: 12,
    imageName: "avoine_fruits.jpg"
  },
  {
    userId: userThomas._id,
    type: "déjeuner",
    calories: 620,
    proteines: 30,
    glucides: 60,
    lipides: 20,
    imageName: "poulet_riz.jpg"
  },
  {
    userId: userThomas._id,
    type: "dîner",
    calories: 450,
    proteines: 22,
    glucides: 40,
    lipides: 15,
    imageName: "poisson_legumes.jpg"
  }
]);

// 🍽️ Repas pour Sarah
await Meal.insertMany([
  {
    userId: userSarah._id,
    type: "déjeuner",
    calories: 520,
    proteines: 25,
    glucides: 55,
    lipides: 18,
    imageName: "salade_quinoa.jpg"
  },
  {
    userId: userSarah._id,
    type: "dîner",
    calories: 380,
    proteines: 20,
    glucides: 35,
    lipides: 12,
    imageName: "soupe_legumes.jpg"
  }
]);

console.log("✅ Données de repas créées");

console.log("📊 Création des données de santé...");

// 📊 Données santé pour Thomas (7 derniers jours)
const thomasHealthData = [];
for (let i = 6; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  
  thomasHealthData.push({
    userId: userThomas._id,
    date: date.toISOString().split('T')[0],
    sommeil: 7.5 + Math.random() * 1.0,
    stress: 1 + Math.random() * 2,
    hydratation: 2.0 + Math.random() * 1.0,
    energie: 80 + Math.random() * 15,
    activite: 8500 + Math.random() * 2000,
    score: 75 + Math.random() * 20
  });
}

await Health.insertMany(thomasHealthData);

// 📊 Données santé pour Sarah
const sarahHealthData = [];
for (let i = 6; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  
  sarahHealthData.push({
    userId: userSarah._id,
    date: date.toISOString().split('T')[0],
    sommeil: 6.0 + Math.random() * 1.5,
    stress: 2 + Math.random() * 2,
    hydratation: 1.5 + Math.random() * 1.0,
    energie: 60 + Math.random() * 20,
    activite: 5500 + Math.random() * 2000,
    score: 60 + Math.random() * 25
  });
}

await Health.insertMany(sarahHealthData);

console.log("✅ Données de santé créées");

console.log("🧠 Création des logs Learn...");

// 🧠 Logs Learn pour les interactions IA
await Learn.insertMany([
  {
    userId: userThomas._id,
    type: 'chat',
    context: 'Comment améliorer mon sommeil ?',
    result: 'Conseils personnalisés sur l\'hygiène du sommeil'
  },
  {
    userId: userThomas._id,
    type: 'health',
    context: 'Analyse des métriques de santé',
    result: 'Score santé calculé et recommandations'
  },
  {
    userId: userSarah._id,
    type: 'goals',
    context: 'Définition d\'objectifs fitness',
    result: 'Objectifs personnalisés générés'
  },
  {
    userId: userSarah._id,
    type: 'workout',
    context: 'Génération programme d\'entraînement',
    result: 'Programme 7 jours créé'
  },
  {
    userId: testUser._id,
    type: 'chat',
    context: 'Test message audit',
    result: 'Réponse test pour validation'
  }
]);

console.log("✅ Logs Learn créés");

// Statistiques finales
const userCount = await User.countDocuments();
const mealCount = await Meal.countDocuments();
const healthCount = await Health.countDocuments();
const learnCount = await Learn.countDocuments();

console.log("\n🎉 SEED MONGODB TERMINÉ AVEC SUCCÈS !");
console.log("=====================================");
console.log(`👤 Utilisateurs créés: ${userCount}`);
console.log(`🍽️ Repas créés: ${mealCount}`);
console.log(`📊 Données santé créées: ${healthCount}`);
console.log(`🧠 Logs Learn créés: ${learnCount}`);

console.log("\n📋 UTILISATEURS DE TEST DISPONIBLES:");
console.log("====================================");
console.log("🔹 thomas@coach.com (Premium) - motdepasse123");
console.log("🔹 sarah@coach.com (Gratuit) - motdepasse123");
console.log("🔹 maxime@coach.com (Premium) - motdepasse123");
console.log("🔹 testuser@example.com (Test Audit) - motdepasse");

console.log("\n✨ Votre base de données est maintenant prête pour les tests et l'audit !");

// Fermeture de la connexion
await mongoose.connection.close();
console.log("🔌 Connexion MongoDB fermée");

process.exit(0);
