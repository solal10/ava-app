const mongoose = require('mongoose');

const heartRateDataSchema = new mongoose.Schema({
  resting: Number,
  average: Number,
  maximum: Number,
  zones: {
    zone1: Number, // 50-60% max HR
    zone2: Number, // 60-70% max HR
    zone3: Number, // 70-80% max HR
    zone4: Number, // 80-90% max HR
    zone5: Number  // 90-100% max HR
  }
});

const sleepDataSchema = new mongoose.Schema({
  totalSleepTime: Number,      // en secondes
  deepSleepTime: Number,       // en secondes
  lightSleepTime: Number,      // en secondes
  remSleepTime: Number,        // en secondes
  awakeDuration: Number,       // en secondes
  sleepScore: Number,          // 0-100
  sleepQuality: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent']
  },
  restfulnessValue: Number,
  sleepStartTime: Date,
  sleepEndTime: Date
});

const stressDataSchema = new mongoose.Schema({
  averageLevel: Number,        // 0-100
  maxLevel: Number,           // 0-100
  stressDuration: Number,     // en minutes
  restStressLevel: Number,
  activityStressLevel: Number,
  stressQualifier: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high']
  }
});

const activityDataSchema = new mongoose.Schema({
  activityId: String,
  name: String,
  type: String,
  startTime: Date,
  endTime: Date,
  duration: Number,            // en secondes
  distance: Number,            // en mètres
  calories: Number,
  averageHeartRate: Number,
  maxHeartRate: Number,
  averageSpeed: Number,        // en m/s
  maxSpeed: Number,           // en m/s
  elevationGain: Number,      // en mètres
  averagePower: Number,       // watts
  steps: Number,
  strokes: Number,            // natation/aviron
  intensityMinutes: {
    vigorous: Number,
    moderate: Number
  }
});

const bodyCompositionSchema = new mongoose.Schema({
  weight: Number,              // kg
  bodyFat: Number,            // pourcentage
  muscleMass: Number,         // kg
  boneMass: Number,           // kg
  bodyWater: Number,          // pourcentage
  visceralFat: Number,        // niveau 1-59
  metabolicAge: Number,       // années
  bmi: Number
});

const garminDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  garminUserId: {
    type: String,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  dataType: {
    type: String,
    enum: ['daily_summary', 'activity', 'sleep', 'stress', 'heart_rate', 'body_composition'],
    required: true,
    index: true
  },
  
  // Données de base quotidiennes
  basicMetrics: {
    steps: Number,
    distance: Number,            // en mètres
    calories: Number,
    floorsClimbed: Number,
    activeMinutes: {
      vigorous: Number,
      moderate: Number,
      total: Number
    }
  },
  
  // Données spécialisées
  heartRate: heartRateDataSchema,
  sleep: sleepDataSchema,
  stress: stressDataSchema,
  activity: activityDataSchema,
  bodyComposition: bodyCompositionSchema,
  
  // Métriques avancées
  advancedMetrics: {
    vo2Max: Number,
    bodyBattery: Number,         // 5-100
    trainingEffect: {
      aerobic: Number,           // 0-5
      anaerobic: Number          // 0-5
    },
    recovery: {
      recoveryTime: Number,      // heures
      recoveryHeartRate: Number
    },
    fitnessAge: Number,
    stressScore: Number,
    performanceCondition: Number // -20 à +20
  },
  
  // Données brutes Garmin
  rawGarminData: mongoose.Schema.Types.Mixed,
  
  // Métadonnées
  metadata: {
    deviceName: String,
    deviceId: String,
    softwareVersion: String,
    syncedAt: Date,
    webhookReceived: Boolean,
    dataQuality: {
      type: String,
      enum: ['high', 'medium', 'low', 'estimated'],
      default: 'high'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    }
  },
  
  // Traitement et analyse
  processing: {
    processed: {
      type: Boolean,
      default: false
    },
    processedAt: Date,
    anomalies: [{
      type: String,
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
      }
    }],
    trends: {
      improving: [String],
      declining: [String],
      stable: [String]
    }
  }
}, {
  timestamps: true
});

// Index composites pour optimiser les requêtes
garminDataSchema.index({ userId: 1, date: -1 });
garminDataSchema.index({ userId: 1, dataType: 1, date: -1 });
garminDataSchema.index({ garminUserId: 1, date: -1 });
garminDataSchema.index({ date: -1, dataType: 1 });
garminDataSchema.index({ 'metadata.syncedAt': -1 });

// Index pour les requêtes d'agrégation
garminDataSchema.index({ userId: 1, 'basicMetrics.steps': -1 });
garminDataSchema.index({ userId: 1, 'sleep.sleepScore': -1 });
garminDataSchema.index({ userId: 1, 'stress.averageLevel': 1 });

// Méthodes d'instance
garminDataSchema.methods.calculateHealthScore = function() {
  let score = 0;
  let factors = 0;
  
  // Score basé sur les pas
  if (this.basicMetrics?.steps) {
    const stepScore = Math.min(100, (this.basicMetrics.steps / 10000) * 100);
    score += stepScore * 0.25;
    factors++;
  }
  
  // Score basé sur le sommeil
  if (this.sleep?.sleepScore) {
    score += this.sleep.sleepScore * 0.25;
    factors++;
  }
  
  // Score basé sur le stress (inversé)
  if (this.stress?.averageLevel !== undefined) {
    const stressScore = Math.max(0, 100 - this.stress.averageLevel);
    score += stressScore * 0.25;
    factors++;
  }
  
  // Score basé sur l'activité
  if (this.basicMetrics?.activeMinutes?.total) {
    const activityScore = Math.min(100, (this.basicMetrics.activeMinutes.total / 30) * 100);
    score += activityScore * 0.25;
    factors++;
  }
  
  if (factors > 0) {
    return Math.round((score / (factors * 0.25)) * 100);
  }
  
  return 75; // Score par défaut
};

garminDataSchema.methods.detectAnomalies = function() {
  const anomalies = [];
  
  // Détection d'anomalies dans les pas
  if (this.basicMetrics?.steps) {
    if (this.basicMetrics.steps > 50000) {
      anomalies.push({
        type: 'high_steps',
        description: 'Nombre de pas inhabituellement élevé',
        severity: 'medium'
      });
    } else if (this.basicMetrics.steps < 1000) {
      anomalies.push({
        type: 'low_steps',
        description: 'Nombre de pas très faible',
        severity: 'low'
      });
    }
  }
  
  // Détection d'anomalies dans le sommeil
  if (this.sleep?.totalSleepTime) {
    const sleepHours = this.sleep.totalSleepTime / 3600;
    if (sleepHours < 4) {
      anomalies.push({
        type: 'insufficient_sleep',
        description: 'Sommeil insuffisant détecté',
        severity: 'high'
      });
    } else if (sleepHours > 12) {
      anomalies.push({
        type: 'excessive_sleep',
        description: 'Sommeil excessif détecté',
        severity: 'medium'
      });
    }
  }
  
  // Détection d'anomalies dans le stress
  if (this.stress?.averageLevel > 90) {
    anomalies.push({
      type: 'high_stress',
      description: 'Niveau de stress très élevé',
      severity: 'high'
    });
  }
  
  this.processing.anomalies = anomalies;
  return anomalies;
};

garminDataSchema.methods.markAsProcessed = function() {
  this.processing.processed = true;
  this.processing.processedAt = new Date();
  this.detectAnomalies();
};

// Méthodes statiques
garminDataSchema.statics.getLatestByUser = function(userId, dataType = null) {
  const query = { userId };
  if (dataType) query.dataType = dataType;
  
  return this.findOne(query).sort({ date: -1 });
};

garminDataSchema.statics.getDateRange = function(userId, startDate, endDate, dataType = null) {
  const query = {
    userId,
    date: { $gte: startDate, $lte: endDate }
  };
  if (dataType) query.dataType = dataType;
  
  return this.find(query).sort({ date: 1 });
};

garminDataSchema.statics.getWeeklyAverage = function(userId, weeksBack = 4) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeksBack * 7));
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        dataType: 'daily_summary'
      }
    },
    {
      $group: {
        _id: null,
        averageSteps: { $avg: '$basicMetrics.steps' },
        averageCalories: { $avg: '$basicMetrics.calories' },
        averageSleep: { $avg: '$sleep.sleepScore' },
        averageStress: { $avg: '$stress.averageLevel' }
      }
    }
  ]);
};

garminDataSchema.statics.getTrends = function(userId, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        dataType: 'daily_summary'
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $group: {
        _id: null,
        dates: { $push: '$date' },
        steps: { $push: '$basicMetrics.steps' },
        sleepScores: { $push: '$sleep.sleepScore' },
        stressLevels: { $push: '$stress.averageLevel' }
      }
    }
  ]);
};

// Middleware pré-sauvegarde
garminDataSchema.pre('save', function(next) {
  // Assurer que les métadonnées de sync sont définies
  if (!this.metadata.syncedAt) {
    this.metadata.syncedAt = new Date();
  }
  
  // Marquer comme webhook si les données viennent d'un webhook
  if (!this.metadata.webhookReceived) {
    this.metadata.webhookReceived = false;
  }
  
  next();
});

module.exports = mongoose.model('GarminData', garminDataSchema);