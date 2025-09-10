const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['g', 'ml', 'cups', 'pieces', 'tbsp', 'tsp', 'oz'],
    required: true
  },
  calories: {
    type: Number,
    min: 0
  },
  macros: {
    protein: {
      type: Number,
      min: 0
    },
    carbs: {
      type: Number,
      min: 0
    },
    fat: {
      type: Number,
      min: 0
    },
    fiber: {
      type: Number,
      min: 0
    },
    sugar: {
      type: Number,
      min: 0
    }
  },
  micronutrients: {
    sodium: Number,      // mg
    potassium: Number,   // mg
    calcium: Number,     // mg
    iron: Number,        // mg
    vitaminC: Number,    // mg
    vitaminD: Number     // IU
  },
  spoonacularId: Number,
  imageUrl: String
});

const mealSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  items: [mealItemSchema],
  totalCalories: {
    type: Number,
    min: 0
  },
  totalMacros: {
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  prepTime: {
    type: Number, // en minutes
    min: 0,
    max: 180
  },
  cookTime: {
    type: Number, // en minutes
    min: 0,
    max: 300
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  instructions: [String],
  tags: [String],
  imageUrl: String,
  recipe: {
    spoonacularId: Number,
    sourceUrl: String,
    sourceName: String
  }
});

const dailyNutritionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  meals: [mealSchema],
  totalCalories: {
    type: Number,
    min: 0
  },
  totalMacros: {
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  waterIntake: {
    type: Number, // en litres
    min: 0,
    max: 10,
    default: 0
  },
  notes: String
});

const nutritionPlanSchema = new mongoose.Schema({
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
    enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'athletic_performance', 'health_improvement'],
    required: true
  },
  duration: {
    type: Number, // en jours
    required: true,
    min: 1,
    max: 365
  },
  targetCalories: {
    daily: {
      type: Number,
      required: true,
      min: 800,
      max: 5000
    },
    breakdown: {
      protein: {
        grams: Number,
        percentage: Number
      },
      carbs: {
        grams: Number,
        percentage: Number
      },
      fat: {
        grams: Number,
        percentage: Number
      }
    }
  },
  restrictions: {
    dietary: [{
      type: String,
      enum: [
        'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean',
        'low_carb', 'low_fat', 'high_protein', 'gluten_free', 'dairy_free',
        'nut_free', 'soy_free', 'egg_free'
      ]
    }],
    allergies: [String],
    dislikes: [String]
  },
  dailyPlans: [dailyNutritionSchema],
  preferences: {
    mealsPerDay: {
      type: Number,
      min: 3,
      max: 6,
      default: 3
    },
    cookingTime: {
      type: String,
      enum: ['minimal', 'moderate', 'extensive'],
      default: 'moderate'
    },
    budget: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    cuisineTypes: [String]
  },
  createdBy: {
    type: String,
    enum: ['user', 'ai', 'nutritionist'],
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
    },
    spoonacularUsed: Boolean
  },
  stats: {
    averageCalories: Number,
    adherenceRate: {
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
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  subscriptionRequired: {
    type: String,
    enum: ['explore', 'perform', 'pro', 'elite'],
    default: 'perform'
  }
}, {
  timestamps: true
});

// Index composites
nutritionPlanSchema.index({ userId: 1, isActive: 1 });
nutritionPlanSchema.index({ goal: 1, 'restrictions.dietary': 1 });
nutritionPlanSchema.index({ 'stats.averageRating': -1 });
nutritionPlanSchema.index({ 'dailyPlans.date': 1 });

// Méthodes d'instance
nutritionPlanSchema.methods.calculateDayCalories = function(dayIndex) {
  if (!this.dailyPlans[dayIndex]) return 0;
  
  return this.dailyPlans[dayIndex].meals.reduce((total, meal) => {
    return total + (meal.totalCalories || 0);
  }, 0);
};

nutritionPlanSchema.methods.getAverageCalories = function() {
  if (this.dailyPlans.length === 0) return 0;
  
  const totalCalories = this.dailyPlans.reduce((total, day) => {
    return total + (day.totalCalories || 0);
  }, 0);
  
  return Math.round(totalCalories / this.dailyPlans.length);
};

nutritionPlanSchema.methods.getMacroBreakdown = function() {
  if (this.dailyPlans.length === 0) return { protein: 0, carbs: 0, fat: 0 };
  
  const totalMacros = this.dailyPlans.reduce((totals, day) => {
    return {
      protein: totals.protein + (day.totalMacros?.protein || 0),
      carbs: totals.carbs + (day.totalMacros?.carbs || 0),
      fat: totals.fat + (day.totalMacros?.fat || 0)
    };
  }, { protein: 0, carbs: 0, fat: 0 });
  
  return {
    protein: Math.round(totalMacros.protein / this.dailyPlans.length),
    carbs: Math.round(totalMacros.carbs / this.dailyPlans.length),
    fat: Math.round(totalMacros.fat / this.dailyPlans.length)
  };
};

nutritionPlanSchema.methods.getDayPlan = function(date) {
  const targetDate = new Date(date);
  return this.dailyPlans.find(day => 
    day.date.toDateString() === targetDate.toDateString()
  );
};

nutritionPlanSchema.methods.incrementUsage = async function() {
  this.stats.timesUsed += 1;
  return await this.save();
};

// Méthodes statiques
nutritionPlanSchema.statics.findByGoal = function(goal, restrictions = []) {
  const query = { goal, isActive: true };
  if (restrictions.length > 0) {
    query['restrictions.dietary'] = { $in: restrictions };
  }
  return this.find(query).sort({ 'stats.averageRating': -1 });
};

nutritionPlanSchema.statics.findByCalorieRange = function(minCalories, maxCalories) {
  return this.find({
    'targetCalories.daily': { $gte: minCalories, $lte: maxCalories },
    isActive: true
  }).sort({ 'stats.averageRating': -1 });
};

nutritionPlanSchema.statics.getPopularPlans = function(limit = 10) {
  return this.find({ isActive: true, isPublic: true })
    .sort({ 'stats.timesUsed': -1 })
    .limit(limit);
};

// Middleware pré-sauvegarde
nutritionPlanSchema.pre('save', function(next) {
  // Calculer les calories moyennes
  this.stats.averageCalories = this.getAverageCalories();
  
  // Calculer les calories totales pour chaque jour
  this.dailyPlans.forEach(day => {
    day.totalCalories = day.meals.reduce((total, meal) => {
      return total + (meal.totalCalories || 0);
    }, 0);
    
    // Calculer les macros totales pour le jour
    const totalMacros = day.meals.reduce((totals, meal) => ({
      protein: totals.protein + (meal.totalMacros?.protein || 0),
      carbs: totals.carbs + (meal.totalMacros?.carbs || 0),
      fat: totals.fat + (meal.totalMacros?.fat || 0),
      fiber: totals.fiber + (meal.totalMacros?.fiber || 0)
    }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });
    
    day.totalMacros = totalMacros;
  });
  
  next();
});

// Middleware pour calculer les totaux des repas
mealSchema.pre('save', function(next) {
  // Calculer les calories totales du repas
  this.totalCalories = this.items.reduce((total, item) => {
    return total + (item.calories || 0);
  }, 0);
  
  // Calculer les macros totales du repas
  this.totalMacros = this.items.reduce((totals, item) => ({
    protein: totals.protein + (item.macros?.protein || 0),
    carbs: totals.carbs + (item.macros?.carbs || 0),
    fat: totals.fat + (item.macros?.fat || 0),
    fiber: totals.fiber + (item.macros?.fiber || 0)
  }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });
  
  next();
});

module.exports = mongoose.model('NutritionPlan', nutritionPlanSchema);