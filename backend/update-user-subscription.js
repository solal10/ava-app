const mongoose = require('mongoose');
const User = require('./src/models/user.model');

// Script pour mettre à jour l'abonnement d'un utilisateur spécifique
async function updateUserSubscription() {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ava-app';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Rechercher l'utilisateur par email
    const userEmail = 'thomb.17@icloud.com';
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`❌ Utilisateur avec l'email ${userEmail} non trouvé`);
      return;
    }

    console.log(`📧 Utilisateur trouvé: ${user.prenom} (${user.email})`);
    console.log(`📊 Abonnement actuel: ${user.subscriptionLevel} - Premium: ${user.isPremium}`);

    // Mettre à jour vers Elite avec tous les privilèges
    user.subscriptionLevel = 'elite';
    user.isPremium = true;
    
    // Sauvegarder les modifications
    await user.save();

    console.log('🎉 Abonnement mis à jour avec succès!');
    console.log(`🏆 Nouveau statut: Elite - Premium: ${user.isPremium}`);
    console.log('✨ Accès complet à toutes les fonctionnalités débloqué');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le script
updateUserSubscription();
