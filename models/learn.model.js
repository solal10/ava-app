const mongoose = require('mongoose');

const LearnSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['advice', 'chat', 'health', 'workout', 'nutrition', 'goals'], 
    required: true 
  },
  context: { 
    type: String,
    required: true
  },
  result: { 
    type: String,
    required: true
  },
  metadata: {
    userInput: String,
    aiResponse: String,
    confidence: Number,
    source: String,
    sessionId: String
  },
  feedback: {
    helpful: { type: Boolean, default: null },
    rating: { type: Number, min: 1, max: 5 },
    comment: String
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des requêtes
LearnSchema.index({ userId: 1, type: 1, timestamp: -1 });
LearnSchema.index({ timestamp: -1 });

// Méthode statique pour obtenir les apprentissages par utilisateur
LearnSchema.statics.getByUser = function(userId, type = null, limit = 50) {
  const query = { userId };
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Méthode statique pour obtenir les statistiques d'apprentissage
LearnSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgRating: { $avg: '$feedback.rating' },
        lastActivity: { $max: '$timestamp' }
      }
    }
  ]);
};

module.exports = mongoose.model('Learn', LearnSchema);
