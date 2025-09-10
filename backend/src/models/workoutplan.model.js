const mongoose = require('mongoose');

const workoutExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['cardio', 'strength', 'flexibility', 'balance', 'hiit', 'yoga', 'pilates'],
    required: true
  },
  duration: {
    type: Number, // en minutes
    min: 1,
    max: 180
  },
  sets: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },
  reps: {
    type: Number,
    min: 1,
    max: 100
  },
  weight: {
    type: Number, // en kg
    min: 0,
    max: 500
  },
  restTime: {
    type: Number, // en secondes
    min: 10,
    max: 600,
    default: 60
  },
  instructions: {
    type: String,
    maxlength: 500
  },
  targetMuscles: [{
    type: String,
    enum: [
      'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
      'core', 'abs', 'obliques',
      'glutes', 'quadriceps', 'hamstrings', 'calves',
      'full-body', 'cardio'
    ]
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  caloriesBurn: {
    type: Number, // estimation
    min: 0
  }
});

const workoutPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  goal: {
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  duration: {
    type: Number, // durée totale en minutes
    required: true,
    min: 10,
    max: 180
  },
  frequency: {
    timesPerWeek: {
      type: Number,
      min: 1,
      max: 7,
      default: 3
    },
    totalWeeks: {
      type: Number,
      min: 1,
      max: 52,
      default: 4
    }
  },
  exercises: [workoutExerciseSchema],
  equipment: [{
    type: String,
    enum: [
      'none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands',
      'pull_up_bar', 'bench', 'treadmill', 'stationary_bike', 'rowing_machine',
      'yoga_mat', 'stability_ball', 'medicine_ball'
    ]
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    enum: ['user', 'ai', 'trainer'],
    default: 'user'
  },
  aiGenerated: {
    prompt: String,
    model: String,
    generatedAt: Date,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  stats: {
    totalCalories: {
      type: Number,
      min: 0
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5
    },
    timesUsed: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  schedule: {
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    preferredTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime'
    }
  },
  progression: {
    weeklyIncrease: {
      weight: {
        type: Number,
        min: 0,
        max: 10,
        default: 2.5 // kg
      },
      duration: {
        type: Number,
        min: 0,
        max: 30,
        default: 5 // minutes
      },
      intensity: {
        type: Number,
        min: 0,
        max: 20,
        default: 5 // pourcentage
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscriptionRequired: {
    type: String,
    enum: ['explore', 'perform', 'pro', 'elite'],
    default: 'explore'
  }
}, {
  timestamps: true
});

// Index composites pour les requêtes fréquentes
workoutPlanSchema.index({ userId: 1, isActive: 1 });
workoutPlanSchema.index({ goal: 1, difficulty: 1 });
workoutPlanSchema.index({ 'stats.averageRating': -1 });
workoutPlanSchema.index({ tags: 1 });
workoutPlanSchema.index({ equipment: 1 });

// Méthodes d'instance
workoutPlanSchema.methods.calculateTotalCalories = function() {
  return this.exercises.reduce((total, exercise) => {
    return total + (exercise.caloriesBurn || 0);
  }, 0);
};

workoutPlanSchema.methods.getTotalDuration = function() {
  return this.exercises.reduce((total, exercise) => {
    return total + (exercise.duration || 0);
  }, 0);
};

workoutPlanSchema.methods.getRequiredEquipment = function() {
  return [...new Set(this.equipment)];
};

workoutPlanSchema.methods.incrementUsage = async function() {
  this.stats.timesUsed += 1;
  return await this.save();
};

// Méthodes statiques
workoutPlanSchema.statics.findByGoal = function(goal, difficulty = null) {
  const query = { goal, isActive: true };
  if (difficulty) query.difficulty = difficulty;
  return this.find(query).sort({ 'stats.averageRating': -1 });
};

workoutPlanSchema.statics.findByEquipment = function(availableEquipment) {
  return this.find({
    equipment: { $in: availableEquipment },
    isActive: true
  }).sort({ 'stats.averageRating': -1 });
};

workoutPlanSchema.statics.getPopularPlans = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.timesUsed': -1 })
    .limit(limit);
};

// Middleware pré-sauvegarde
workoutPlanSchema.pre('save', function(next) {
  // Calculer automatiquement les calories totales
  this.stats.totalCalories = this.calculateTotalCalories();
  
  // Mettre à jour la durée si elle n'est pas définie
  if (!this.duration && this.exercises.length > 0) {
    this.duration = this.getTotalDuration();
  }
  
  next();
});

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);