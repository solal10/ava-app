const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configuration MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/ava-app';

// Schéma utilisateur (copie du modèle)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    trim: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  subscriptionLevel: {
    type: String,
    enum: ['explore', 'perform', 'pro', 'elite'],
    default: 'explore'
  },
  stats: {
    sommeil: { type: Number, min: 0, max: 100, default: 70 },
    stress: { type: Number, min: 0, max: 100, default: 50 },
    hydratation: { type: Number, min: 0, max: 100, default: 60 },
    energie: { type: Number, min: 0, max: 100, default: 65 },
    activite: { type: Number, min: 0, max: 100, default: 50 }
  },
  goals: {
    sommeil: { type: Number, min: 0, max: 100, default: 80 },
    stress: { type: Number, min: 0, max: 100, default: 30 },
    hydratation: { type: Number, min: 0, max: 100, default: 80 },
    energie: { type: Number, min: 0, max: 100, default: 80 },
    activite: { type: Number, min: 0, max: 100, default: 70 }
  },
  preferences: {
    objectif: {
      type: String,
      enum: ['perte_poids', 'endurance', 'force', 'bien_etre', 'competition'],
      default: 'bien_etre'
    },
    etatMental: {
      type: String,
      enum: ['detendu', 'stresse', 'motive', 'fatigue', 'focus'],
      default: 'detendu'
    },
    activiteRecente: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

// Utilisateurs de démonstration
const demoUsers = [
  {
    email: 'thomas@coach.com',
    password: 'motdepasse123',
    prenom: 'Thomas',
    isPremium: true,
    subscriptionLevel: 'pro',
    stats: {
      sommeil: 85,
      stress: 25,
      hydratation: 90,
      energie: 80,
      activite: 75
    },
    goals: {
      sommeil: 90,
      stress: 20,
      hydratation: 95,
      energie: 85,
      activite: 80
    },
    preferences: {
      objectif: 'force',
      etatMental: 'motive',
      activiteRecente: 'Musculation'
    }
  },
  {
    email: 'sarah@coach.com',
    password: 'motdepasse123',
    prenom: 'Sarah',
    isPremium: true,
    subscriptionLevel: 'elite',
    stats: {
      sommeil: 88,
      stress: 20,
      hydratation: 95,
      energie: 90,
      activite: 85
    },
    goals: {
      sommeil: 95,
      stress: 15,
      hydratation: 100,
      energie: 95,
      activite: 90
    },
    preferences: {
      objectif: 'endurance',
      etatMental: 'focus',
      activiteRecente: 'Course à pied'
    }
  },
  {
    email: 'demo@ava.com',
    password: 'demo123',
    prenom: 'Demo',
    isPremium: false,
    subscriptionLevel: 'explore',
    stats: {
      sommeil: 70,
      stress: 50,
      hydratation: 60,
      energie: 65,
      activite: 50
    },
    goals: {
      sommeil: 80,
      stress: 30,
      hydratation: 80,
      energie: 80,
      activite: 70
    },
    preferences: {
      objectif: 'bien_etre',
      etatMental: 'detendu',
      activiteRecente: ''
    }
  }
];

async function createDemoUsers() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connecté');

    console.log('🧹 Suppression des anciens utilisateurs de démo...');
    await User.deleteMany({ 
      email: { $in: demoUsers.map(u => u.email) } 
    });

    console.log('👥 Création des utilisateurs de démo...');
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Utilisateur créé: ${user.email} (${user.subscriptionLevel})`);
    }

    console.log('🎉 Tous les utilisateurs de démo ont été créés avec succès !');
    console.log('\n📋 Comptes disponibles :');
    console.log('• thomas@coach.com / motdepasse123 (Pro)');
    console.log('• sarah@coach.com / motdepasse123 (Elite)');
    console.log('• demo@ava.com / demo123 (Explore)');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Déconnexion de MongoDB');
  }
}

createDemoUsers();