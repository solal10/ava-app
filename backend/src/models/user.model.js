const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    sommeil: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    stress: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    hydratation: {
      type: Number,
      min: 0,
      max: 100,
      default: 60
    },
    energie: {
      type: Number,
      min: 0,
      max: 100,
      default: 65
    },
    activite: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },
  goals: {
    sommeil: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    },
    stress: {
      type: Number,
      min: 0,
      max: 100,
      default: 30
    },
    hydratation: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    },
    energie: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    },
    activite: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    }
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
    activiteRecente: {
      type: String,
      default: ''
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
