const mongoose = require('mongoose');

const healthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  metrics: {
    sommeil: {
      heures: {
        type: Number,
        min: 0,
        max: 24
      },
      qualite: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    stress: {
      niveau: {
        type: Number,
        min: 0,
        max: 100
      },
      facteurs: [String]
    },
    hydratation: {
      verresEau: {
        type: Number,
        min: 0
      },
      score: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    energie: {
      niveau: {
        type: Number,
        min: 0,
        max: 100
      },
      facteurs: [String]
    },
    activite: {
      duree: {
        type: Number, // en minutes
        min: 0
      },
      type: {
        type: String,
        enum: ['cardio', 'musculation', 'yoga', 'marche', 'course', 'natation', 'velo', 'autre']
      },
      intensite: {
        type: Number,
        min: 0,
        max: 10
      }
    }
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: {
    type: String
  },
  source: {
    type: String,
    enum: ['manual', 'garmin', 'apple', 'fitbit', 'ai_prediction'],
    default: 'manual'
  }
}, { timestamps: true });

module.exports = mongoose.models.Health || mongoose.model('Health', healthSchema);
