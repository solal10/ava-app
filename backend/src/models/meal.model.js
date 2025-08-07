const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String
  },
  calories: {
    type: Number,
    min: 0
  },
  nutrients: {
    proteines: {
      type: Number,
      min: 0,
      default: 0
    },
    lipides: {
      type: Number,
      min: 0,
      default: 0
    },
    glucides: {
      type: Number,
      min: 0,
      default: 0
    },
    fibres: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  mealType: {
    type: String,
    enum: ['petit_dejeuner', 'dejeuner', 'diner', 'collation'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  aiAnalysis: {
    foodItems: [String],
    healthScore: {
      type: Number,
      min: 0,
      max: 100
    },
    recommendations: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Meal', mealSchema);
