const mongoose = require('mongoose');
const User = require('./src/models/user.model');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/coach_sante_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedUsers = async () => {
  try {
    console.log('🌱 Création des utilisateurs de test...');

    // Vérifier si les utilisateurs existent déjà
    const existingThomas = await User.findOne({ email: 'thomas@coach.com' });
    const existingSarah = await User.findOne({ email: 'sarah@coach.com' });

    if (existingThomas) {
      console.log('✅ Thomas existe déjà');
    } else {
      // Créer Thomas
      const thomas = new User({
        email: 'thomas@coach.com',
        password: 'motdepasse123', // Sera hashé automatiquement par le modèle
        prenom: 'Thomas',
        isPremium: true,
        subscriptionLevel: 'pro',
        stats: {
          sommeil: 75,
          stress: 40,
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
          activiteRecente: 'musculation'
        }
      });
      await thomas.save();
      console.log('✅ Thomas créé avec succès');
    }

    if (existingSarah) {
      console.log('✅ Sarah existe déjà');
    } else {
      // Créer Sarah
      const sarah = new User({
        email: 'sarah@coach.com',
        password: 'motdepasse123', // Sera hashé automatiquement par le modèle
        prenom: 'Sarah',
        isPremium: true,
        subscriptionLevel: 'elite',
        stats: {
          sommeil: 80,
          stress: 35,
          hydratation: 85,
          energie: 75,
          activite: 70
        },
        goals: {
          sommeil: 90,
          stress: 20,
          hydratation: 95,
          energie: 85,
          activite: 80
        },
        preferences: {
          objectif: 'bien_etre',
          etatMental: 'detendu',
          activiteRecente: 'yoga'
        }
      });
      await sarah.save();
      console.log('✅ Sarah créée avec succès');
    }

    console.log('🎉 Utilisateurs de test créés avec succès !');
    console.log('📧 Connexion Thomas: thomas@coach.com / motdepasse123');
    console.log('📧 Connexion Sarah: sarah@coach.com / motdepasse123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
    process.exit(1);
  }
};

seedUsers();
