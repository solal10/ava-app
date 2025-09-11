const axios = require('axios');
const User = require('../models/user.model');
const Health = require('../models/health.model');

class GarminSyncService {
  constructor() {
    this.baseURL = 'https://apis.garmin.com/wellness-api/rest';
    this.syncInterval = null;
    this.activeSyncs = new Map(); // Track active syncs per user
  }

  /**
   * Démarrer la synchronisation automatique pour un utilisateur
   */
  async startAutoSync(userId, accessToken, intervalMinutes = 5) {
    console.log(`🔄 Démarrage sync auto Garmin pour user ${userId} - interval: ${intervalMinutes}min`);
    
    // Arrêter sync précédente si elle existe
    this.stopAutoSync(userId);
    
    // Sync immédiate
    await this.syncUserData(userId, accessToken);
    
    // Programmer sync périodique
    const intervalId = setInterval(async () => {
      try {
        await this.syncUserData(userId, accessToken);
      } catch (error) {
        console.error(`❌ Erreur sync auto user ${userId}:`, error);
      }
    }, intervalMinutes * 60 * 1000);
    
    this.activeSyncs.set(userId, intervalId);
    return { success: true, message: `Sync automatique démarrée (${intervalMinutes}min)` };
  }

  /**
   * Arrêter la synchronisation automatique
   */
  stopAutoSync(userId) {
    const intervalId = this.activeSyncs.get(userId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeSyncs.delete(userId);
      console.log(`⏹️ Sync auto arrêtée pour user ${userId}`);
    }
  }

  /**
   * Synchroniser toutes les données d'un utilisateur
   */
  async syncUserData(userId, accessToken) {
    console.log(`🔄 Synchronisation Garmin pour user ${userId}...`);
    
    try {
      // Récupérer plusieurs types de données en parallèle
      const [dailySummary, activities, sleep, heartRate, stress] = await Promise.all([
        this.getDailySummary(accessToken),
        this.getActivities(accessToken),
        this.getSleepData(accessToken),
        this.getHeartRateData(accessToken),
        this.getStressData(accessToken)
      ]);

      // Calculer les métriques agrégées
      const healthMetrics = {
        userId,
        date: new Date(),
        metrics: {
          sommeil: {
            heures: sleep?.sleepTimeInSeconds ? sleep.sleepTimeInSeconds / 3600 : 0,
            qualite: this.calculateSleepQuality(sleep)
          },
          stress: {
            niveau: stress?.averageStressLevel || 0,
            facteurs: this.identifyStressFactors(stress)
          },
          hydratation: {
            verresEau: dailySummary?.hydrationInML ? Math.round(dailySummary.hydrationInML / 250) : 0,
            score: this.calculateHydrationScore(dailySummary?.hydrationInML)
          },
          energie: {
            niveau: this.calculateEnergyLevel(dailySummary, sleep, stress),
            facteurs: ['Sommeil', 'Activité', 'Stress']
          },
          activite: {
            duree: activities?.totalDuration || 0,
            type: activities?.primaryActivityType || 'autre',
            intensite: activities?.averageIntensity || 0
          }
        },
        healthScore: this.calculateOverallHealthScore(dailySummary, sleep, stress, activities),
        source: 'garmin',
        garminData: {
          steps: dailySummary?.totalSteps || 0,
          calories: dailySummary?.totalKilocalories || 0,
          distance: dailySummary?.totalDistanceMeters || 0,
          floorsClimbed: dailySummary?.floorsAscended || 0,
          heartRateResting: heartRate?.restingHeartRate || 0,
          heartRateMax: heartRate?.maxHeartRate || 0,
          vo2Max: dailySummary?.vo2Max || 0,
          bodyBattery: dailySummary?.bodyBatteryChargedValue || 0
        }
      };

      // Sauvegarder en base de données
      const savedHealth = await Health.create(healthMetrics);
      
      // Mettre à jour les stats de l'utilisateur
      await this.updateUserStats(userId, healthMetrics);
      
      console.log(`✅ Sync Garmin réussie pour user ${userId}:`, {
        steps: dailySummary?.totalSteps,
        sleep: sleep?.sleepTimeInSeconds / 3600,
        stress: stress?.averageStressLevel
      });

      return { success: true, data: savedHealth };
      
    } catch (error) {
      console.error(`❌ Erreur sync Garmin user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer le résumé quotidien
   */
  async getDailySummary(accessToken, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const response = await axios.get(`${this.baseURL}/dailies`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        params: {
          uploadStartTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000),
          uploadEndTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000) + 86400
        }
      });
      
      return response.data?.[0] || null;
    } catch (error) {
      console.error('Erreur récupération daily summary:', error.message);
      return null;
    }
  }

  /**
   * Récupérer les activités
   */
  async getActivities(accessToken, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const response = await axios.get(`${this.baseURL}/activities`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        params: {
          uploadStartTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000),
          uploadEndTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000) + 86400
        }
      });
      
      const activities = response.data || [];
      
      // Agréger les activités
      return {
        totalDuration: activities.reduce((sum, a) => sum + (a.durationInSeconds || 0), 0) / 60,
        totalCalories: activities.reduce((sum, a) => sum + (a.activeKilocalories || 0), 0),
        primaryActivityType: activities[0]?.activityType || 'autre',
        averageIntensity: this.calculateAverageIntensity(activities),
        count: activities.length
      };
    } catch (error) {
      console.error('Erreur récupération activités:', error.message);
      return null;
    }
  }

  /**
   * Récupérer les données de sommeil
   */
  async getSleepData(accessToken, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const response = await axios.get(`${this.baseURL}/sleeps`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        params: {
          uploadStartTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000) - 86400,
          uploadEndTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000)
        }
      });
      
      return response.data?.[0] || null;
    } catch (error) {
      console.error('Erreur récupération sommeil:', error.message);
      return null;
    }
  }

  /**
   * Récupérer les données de fréquence cardiaque
   */
  async getHeartRateData(accessToken, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const response = await axios.get(`${this.baseURL}/heartrates`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        params: {
          uploadStartTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000),
          uploadEndTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000) + 86400
        }
      });
      
      const samples = response.data || [];
      
      if (samples.length === 0) return null;
      
      // Calculer les métriques
      const heartRates = samples.map(s => s.heartRate);
      return {
        restingHeartRate: Math.min(...heartRates),
        maxHeartRate: Math.max(...heartRates),
        averageHeartRate: heartRates.reduce((a, b) => a + b, 0) / heartRates.length
      };
    } catch (error) {
      console.error('Erreur récupération FC:', error.message);
      return null;
    }
  }

  /**
   * Récupérer les données de stress
   */
  async getStressData(accessToken, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const response = await axios.get(`${this.baseURL}/stressDetails`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        params: {
          uploadStartTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000),
          uploadEndTimeInSeconds: Math.floor(new Date(targetDate).getTime() / 1000) + 86400
        }
      });
      
      const stressData = response.data?.[0] || null;
      
      if (!stressData) return null;
      
      return {
        averageStressLevel: stressData.averageStressLevel || 0,
        maxStressLevel: stressData.maxStressLevel || 0,
        stressQualifier: this.getStressQualifier(stressData.averageStressLevel)
      };
    } catch (error) {
      console.error('Erreur récupération stress:', error.message);
      return null;
    }
  }

  /**
   * Calculer la qualité du sommeil
   */
  calculateSleepQuality(sleepData) {
    if (!sleepData) return 50;
    
    const totalSleep = sleepData.sleepTimeInSeconds / 3600;
    const deepSleep = (sleepData.deepSleepDurationInSeconds || 0) / 3600;
    const remSleep = (sleepData.remSleepInSeconds || 0) / 3600;
    
    // Score basé sur durée totale et qualité
    let score = 0;
    
    // Durée (40 points)
    if (totalSleep >= 7 && totalSleep <= 9) score += 40;
    else if (totalSleep >= 6 && totalSleep < 7) score += 30;
    else if (totalSleep >= 5 && totalSleep < 6) score += 20;
    else score += 10;
    
    // Sommeil profond (30 points)
    const deepPercentage = (deepSleep / totalSleep) * 100;
    if (deepPercentage >= 15) score += 30;
    else if (deepPercentage >= 10) score += 20;
    else score += 10;
    
    // Sommeil REM (30 points)
    const remPercentage = (remSleep / totalSleep) * 100;
    if (remPercentage >= 20) score += 30;
    else if (remPercentage >= 15) score += 20;
    else score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Calculer le score d'hydratation
   */
  calculateHydrationScore(hydrationInML) {
    if (!hydrationInML) return 50;
    
    // Recommandation : 2000-2500ml par jour
    const percentage = (hydrationInML / 2250) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  /**
   * Calculer le niveau d'énergie
   */
  calculateEnergyLevel(dailySummary, sleep, stress) {
    let energyScore = 50; // Base
    
    // Impact du sommeil (+/- 20 points)
    if (sleep?.sleepTimeInSeconds) {
      const sleepHours = sleep.sleepTimeInSeconds / 3600;
      if (sleepHours >= 7 && sleepHours <= 9) energyScore += 20;
      else if (sleepHours >= 6) energyScore += 10;
      else energyScore -= 10;
    }
    
    // Impact du stress (+/- 20 points)
    if (stress?.averageStressLevel) {
      if (stress.averageStressLevel < 25) energyScore += 20;
      else if (stress.averageStressLevel < 50) energyScore += 10;
      else if (stress.averageStressLevel > 75) energyScore -= 20;
    }
    
    // Impact de l'activité (+/- 10 points)
    if (dailySummary?.totalSteps) {
      if (dailySummary.totalSteps >= 10000) energyScore += 10;
      else if (dailySummary.totalSteps >= 7000) energyScore += 5;
    }
    
    return Math.min(100, Math.max(0, energyScore));
  }

  /**
   * Identifier les facteurs de stress
   */
  identifyStressFactors(stressData) {
    const factors = [];
    
    if (!stressData) return ['Données insuffisantes'];
    
    if (stressData.averageStressLevel > 75) {
      factors.push('Stress élevé détecté');
    }
    if (stressData.maxStressLevel > 90) {
      factors.push('Pics de stress importants');
    }
    if (stressData.averageStressLevel < 25) {
      factors.push('Bien détendu');
    }
    
    return factors.length > 0 ? factors : ['Niveau normal'];
  }

  /**
   * Calculer l'intensité moyenne
   */
  calculateAverageIntensity(activities) {
    if (!activities || activities.length === 0) return 0;
    
    const totalIntensity = activities.reduce((sum, activity) => {
      // Convertir METs ou autre métrique en score 0-10
      const mets = activity.metabolicEquivalent || 1;
      return sum + Math.min(10, mets);
    }, 0);
    
    return Math.round(totalIntensity / activities.length);
  }

  /**
   * Qualifier le stress
   */
  getStressQualifier(stressLevel) {
    if (stressLevel < 25) return 'Très faible';
    if (stressLevel < 50) return 'Faible';
    if (stressLevel < 75) return 'Modéré';
    return 'Élevé';
  }

  /**
   * Calculer le score de santé global
   */
  calculateOverallHealthScore(dailySummary, sleep, stress, activities) {
    let score = 0;
    let factors = 0;
    
    // Pas (25%)
    if (dailySummary?.totalSteps) {
      const stepScore = Math.min(100, (dailySummary.totalSteps / 10000) * 100);
      score += stepScore * 0.25;
      factors++;
    }
    
    // Sommeil (25%)
    if (sleep?.sleepTimeInSeconds) {
      const sleepScore = this.calculateSleepQuality(sleep);
      score += sleepScore * 0.25;
      factors++;
    }
    
    // Stress (25%)
    if (stress?.averageStressLevel !== undefined) {
      const stressScore = Math.max(0, 100 - stress.averageStressLevel);
      score += stressScore * 0.25;
      factors++;
    }
    
    // Activité (25%)
    if (activities?.totalDuration) {
      const activityScore = Math.min(100, (activities.totalDuration / 30) * 100);
      score += activityScore * 0.25;
      factors++;
    }
    
    // Si pas de données du tout, score par défaut
    if (factors === 0) {
      return 75; // Score par défaut raisonnable
    }
    
    // Si pas toutes les données, ajuster proportionnellement
    if (factors < 4) {
      const proportion = factors / 4;
      score = score / proportion;
    }
    
    // S'assurer que le score est un nombre valide
    if (isNaN(score) || !isFinite(score)) {
      return 75; // Score par défaut sécurisé
    }
    
    // S'assurer que le résultat est valide
    const finalScore = Math.round(Math.min(100, Math.max(0, score || 75)));
    
    // Vérification anti-NaN
    return isNaN(finalScore) ? 75 : finalScore;
  }

  /**
   * Mettre à jour les statistiques utilisateur
   */
  async updateUserStats(userId, healthMetrics) {
    try {
      const user = await User.findById(userId);
      if (!user) return;
      
      // Mettre à jour les stats actuelles
      user.stats = {
        sommeil: healthMetrics.metrics.sommeil.qualite,
        stress: 100 - healthMetrics.metrics.stress.niveau, // Inverser pour avoir un score positif
        hydratation: healthMetrics.metrics.hydratation.score,
        energie: healthMetrics.metrics.energie.niveau,
        activite: Math.min(100, (healthMetrics.metrics.activite.duree / 30) * 100)
      };
      
      // Ajouter les données Garmin
      user.garminConnected = true;
      user.lastGarminSync = new Date();
      user.garminMetrics = healthMetrics.garminData;
      
      await user.save();
      console.log(`✅ Stats utilisateur ${userId} mises à jour avec données Garmin`);
      
    } catch (error) {
      console.error(`❌ Erreur mise à jour stats user ${userId}:`, error);
    }
  }

  /**
   * Obtenir l'historique de santé enrichi
   */
  async getEnrichedHealthHistory(userId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const healthData = await Health.find({
        userId,
        date: { $gte: startDate },
        source: 'garmin'
      }).sort({ date: -1 });
      
      return healthData.map(data => ({
        date: data.date,
        healthScore: data.healthScore,
        steps: data.garminData?.steps || 0,
        calories: data.garminData?.calories || 0,
        distance: data.garminData?.distance || 0,
        sleepHours: data.metrics?.sommeil?.heures || 0,
        sleepQuality: data.metrics?.sommeil?.qualite || 0,
        stressLevel: data.metrics?.stress?.niveau || 0,
        energyLevel: data.metrics?.energie?.niveau || 0,
        bodyBattery: data.garminData?.bodyBattery || 0,
        vo2Max: data.garminData?.vo2Max || 0
      }));
      
    } catch (error) {
      console.error('Erreur récupération historique enrichi:', error);
      return [];
    }
  }
}

module.exports = new GarminSyncService();