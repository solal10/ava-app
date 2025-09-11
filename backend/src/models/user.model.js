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
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'canceled', 'payment_failed'],
    default: 'active'
  },
  stripeCustomerId: {
    type: String,
    sparse: true
  },
  stripeSubscriptionId: {
    type: String,
    sparse: true
  },
  lastPaymentDate: {
    type: Date
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
  
  // Configuration des notifications push - tokens FCM simplifiés
  fcmTokens: [String],
  
  topicSubscriptions: [{
    type: String,
    enum: ['health_tips', 'workout_reminders', 'nutrition_alerts', 'achievements', 'premium_features']
  }],
  
  notificationPreferences: {
    enabled: {
      type: Boolean,
      default: true
    },
    types: {
      welcome: {
        type: Boolean,
        default: true
      },
      reminder: {
        type: Boolean,
        default: true
      },
      achievement: {
        type: Boolean,
        default: true
      },
      health_alert: {
        type: Boolean,
        default: true
      },
      premium: {
        type: Boolean,
        default: true
      }
    },
    timing: {
      quietHours: {
        enabled: {
          type: Boolean,
          default: false
        },
        start: {
          type: String,
          default: '22:00'
        },
        end: {
          type: String,
          default: '08:00'
        }
      },
      timezone: {
        type: String,
        default: 'Europe/Paris'
      }
    }
  },
  
  notificationHistory: [{
    title: String,
    body: String,
    type: String,
    sentAt: Date,
    success: Boolean,
    tokensCount: Number,
    successCount: Number,
    data: mongoose.Schema.Types.Mixed
  }],
  
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
