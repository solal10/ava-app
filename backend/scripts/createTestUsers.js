require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('❌ Erreur MongoDB :', err);
    process.exit(1);
  });

const createTestUsers = async () => {
  try {
    // Supprimer les utilisateurs existants avec ces emails
    await User.deleteMany({ 
      email: { $in: ['thomas@coach.com', 'sarah@coach.com'] } 
    });

    // Créer l'utilisateur Premium (Thomas)
    const premiumUser = new User({
      email: 'thomas@coach.com',
      password: 'motdepasse123',
      prenom: 'Thomas',
      isPremium: true,
      subscriptionLevel: 'pro',
      stats: {
        sommeil: 75,
        stress: 30,
        hydratation: 80,
        energie: 70,
        activite: 65
      },
      goals: {
        sommeil: 85,
        stress: 25,
        hydratation: 90,
        energie: 80,
        activite: 75
      },
      preferences: {
        objectif: 'force',
        etatMental: 'motive',
        activiteRecente: 'Séance de musculation ce matin'
      }
    });

    // Créer l'utilisateur Gratuit (Sarah)
    const freeUser = new User({
      email: 'sarah@coach.com',
      password: 'motdepasse123',
      prenom: 'Sarah',
      isPremium: false,
      subscriptionLevel: 'explore',
      stats: {
        sommeil: 65,
        stress: 45,
        hydratation: 70,
        energie: 60,
        activite: 75
      },
      goals: {
        sommeil: 80,
        stress: 20,
        hydratation: 85,
        energie: 75,
        activite: 80
      },
      preferences: {
        objectif: 'perte_poids',
        etatMental: 'motive',
        activiteRecente: 'Course à pied hier soir'
      }
    });

    await premiumUser.save();
    await freeUser.save();

    console.log('✅ Utilisateurs de test créés avec succès :');
    console.log('👤 Premium: thomas@coach.com / motdepasse123');
    console.log('👤 Gratuit: sarah@coach.com / motdepasse123');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs :', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
};

createTestUsers();
