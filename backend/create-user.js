const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/coach_sante_db');

// User schema (simplified)
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  subscription: { type: String, default: 'Pro' },
  stats: {
    sommeil: { type: Number, default: 75 },
    stress: { type: Number, default: 30 },
    hydratation: { type: Number, default: 75 },
    energie: { type: Number, default: 70 },
    activite: { type: Number, default: 65 }
  },
  garminConnected: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function createUser() {
  try {
    // Delete existing user if any
    await User.deleteOne({ email: 'thomb.17@icloud.com' });
    console.log('🗑️  Ancien compte supprimé');

    // Hash password
    const hashedPassword = await bcrypt.hash('Ava1996@', 10);

    // Create new user
    const newUser = new User({
      name: 'Thomas',
      email: 'thomb.17@icloud.com',
      password: hashedPassword,
      subscription: 'Pro',
      stats: {
        sommeil: 75,
        stress: 30,
        hydratation: 75,
        energie: 70,
        activite: 65
      },
      garminConnected: false
    });

    await newUser.save();
    console.log('✅ Compte Thomas créé avec succès!');
    console.log('📧 Email: thomb.17@icloud.com');
    console.log('🔑 Mot de passe: Ava1996@');
    console.log('🎯 Subscription: Pro');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createUser();