/**
 * Garmin Connect Bridge SDK
 * Interface pour récupérer les données de santé depuis Garmin Connect
 * 
 * Données supportées:
 * - Sommeil (durée, qualité, phases)
 * - Fréquence cardiaque (repos, max, zones)
 * - Body Battery (énergie corporelle)
 * - Activité physique (pas, distance, calories)
 * - VO2Max (condition physique)
 * - Stress (niveau de stress)
 */

class GarminBridge {
  constructor() {
    this.isConnected = false;
    this.deviceInfo = null;
    this.lastSync = null;
    this.apiEndpoint = 'https://connect.garmin.com/modern/proxy/';
  }

  /**
   * Initialiser la connexion avec Garmin Connect
   * @param {Object} credentials - Identifiants Garmin Connect
   * @returns {Promise<boolean>} - Statut de la connexion
   */
  async initialize(credentials = null) {
    try {
      // Simulation de l'authentification Garmin Connect
      console.log('🔗 Connexion à Garmin Connect...');
      
      // En production, ici on ferait l'authentification OAuth
      await this.simulateAuth();
      
      this.isConnected = true;
      this.lastSync = new Date();
      
      console.log('✅ Connecté à Garmin Connect');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion Garmin:', error);
      return false;
    }
  }

  /**
   * Simuler l'authentification (à remplacer par OAuth en production)
   */
  async simulateAuth() {
    return new Promise(resolve => {
      setTimeout(() => {
        this.deviceInfo = {
          deviceName: 'Garmin Forerunner 945',
          deviceId: 'GRM_945_001',
          firmwareVersion: '20.00',
          batteryLevel: 85
        };
        resolve();
      }, 1000);
    });
  }

  /**
   * Récupérer les données de sommeil
   * @param {string} date - Date au format YYYY-MM-DD
   * @returns {Promise<Object>} - Données de sommeil
   */
  async getSleepData(date = null) {
    if (!this.isConnected) {
      throw new Error('Garmin Connect non connecté');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Simulation des données de sommeil Garmin
    return {
      date: targetDate,
      totalSleepTime: 7.5, // heures
      deepSleep: 1.8, // heures
      lightSleep: 4.2, // heures
      remSleep: 1.5, // heures
      awakeTime: 0.3, // heures
      sleepScore: 82, // score sur 100
      bedTime: '23:15',
      wakeTime: '06:45',
      sleepQuality: 'good', // poor, fair, good, excellent
      restlessness: 'low', // low, medium, high
      source: 'garmin',
      deviceId: this.deviceInfo.deviceId,
      syncTime: new Date().toISOString()
    };
  }

  /**
   * Récupérer les données de fréquence cardiaque
   * @param {string} date - Date au format YYYY-MM-DD
   * @returns {Promise<Object>} - Données de fréquence cardiaque
   */
  async getHeartRateData(date = null) {
    if (!this.isConnected) {
      throw new Error('Garmin Connect non connecté');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Génération de données HR réalistes sur 24h
    const hrData = [];
    for (let hour = 0; hour < 24; hour++) {
      let baseHR = 65; // HR de repos
      
      // Simulation des variations selon l'heure
      if (hour >= 6 && hour <= 22) { // Journée active
        baseHR += Math.random() * 30 + 10; // 75-105 bpm
      }
      if (hour >= 9 && hour <= 11) { // Pic matinal
        baseHR += 20;
      }
      if (hour >= 18 && hour <= 20) { // Pic soirée
        baseHR += 15;
      }
      
      hrData.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        heartRate: Math.round(baseHR + (Math.random() - 0.5) * 10)
      });
    }

    return {
      date: targetDate,
      restingHeartRate: 62, // bpm
      maxHeartRate: 185, // bpm
      averageHeartRate: 78, // bpm
      hrZones: {
        zone1: { min: 111, max: 129, time: 120 }, // minutes
        zone2: { min: 129, max: 148, time: 45 },
        zone3: { min: 148, max: 166, time: 20 },
        zone4: { min: 166, max: 185, time: 5 },
        zone5: { min: 185, max: 200, time: 0 }
      },
      hourlyData: hrData,
      source: 'garmin',
      deviceId: this.deviceInfo.deviceId,
      syncTime: new Date().toISOString()
    };
  }

  /**
   * Récupérer les données Body Battery (énergie corporelle)
   * @param {string} date - Date au format YYYY-MM-DD
   * @returns {Promise<Object>} - Données Body Battery
   */
  async getBodyBatteryData(date = null) {
    if (!this.isConnected) {
      throw new Error('Garmin Connect non connecté');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Génération de données Body Battery réalistes
    const batteryData = [];
    let currentLevel = 85; // Niveau de départ
    
    for (let hour = 0; hour < 24; hour++) {
      // Simulation des variations de Body Battery
      if (hour >= 22 || hour <= 6) { // Nuit - recharge
        currentLevel += Math.random() * 5;
      } else if (hour >= 7 && hour <= 19) { // Journée - décharge
        currentLevel -= Math.random() * 8 + 2;
      }
      
      currentLevel = Math.max(5, Math.min(100, currentLevel));
      
      batteryData.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        level: Math.round(currentLevel)
      });
    }

    return {
      date: targetDate,
      currentLevel: batteryData[batteryData.length - 1].level,
      startLevel: batteryData[0].level,
      maxLevel: Math.max(...batteryData.map(d => d.level)),
      minLevel: Math.min(...batteryData.map(d => d.level)),
      averageLevel: Math.round(batteryData.reduce((sum, d) => sum + d.level, 0) / batteryData.length),
      hourlyData: batteryData,
      drainFactors: [
        { factor: 'Stress', impact: 'medium' },
        { factor: 'Activité intense', impact: 'high' },
        { factor: 'Sommeil insuffisant', impact: 'high' }
      ],
      source: 'garmin',
      deviceId: this.deviceInfo.deviceId,
      syncTime: new Date().toISOString()
    };
  }

  /**
   * Récupérer les données d'activité physique
   * @param {string} date - Date au format YYYY-MM-DD
   * @returns {Promise<Object>} - Données d'activité
   */
  async getActivityData(date = null) {
    if (!this.isConnected) {
      throw new Error('Garmin Connect non connecté');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    return {
      date: targetDate,
      steps: 8750,
      distance: 6.2, // km
      activeCalories: 420,
      totalCalories: 2150,
      activeMinutes: 85,
      intensityMinutes: {
        moderate: 45,
        vigorous: 25
      },
      floors: 12,
      activities: [
        {
          type: 'running',
          startTime: '07:30',
          duration: 35, // minutes
          distance: 5.2, // km
          calories: 280,
          avgHeartRate: 155,
          maxHeartRate: 172
        },
        {
          type: 'walking',
          startTime: '12:15',
          duration: 20,
          distance: 1.8,
          calories: 85,
          avgHeartRate: 95,
          maxHeartRate: 110
        }
      ],
      source: 'garmin',
      deviceId: this.deviceInfo.deviceId,
      syncTime: new Date().toISOString()
    };
  }

  /**
   * Récupérer les données VO2Max
   * @returns {Promise<Object>} - Données VO2Max
   */
  async getVO2MaxData() {
    if (!this.isConnected) {
      throw new Error('Garmin Connect non connecté');
    }

    return {
      currentVO2Max: 52.3, // ml/kg/min
      fitnessAge: 28, // âge de forme physique
      category: 'excellent', // poor, fair, good, excellent, superior
      trend: 'improving', // declining, stable, improving
      history: [
        { date: '2024-01-01', value: 50.1 },
        { date: '2024-01-15', value: 51.2 },
        { date: '2024-02-01', value: 51.8 },
        { date: '2024-02-15', value: 52.3 }
      ],
      recommendations: [
        'Continuez vos entraînements d\'endurance',
        'Ajoutez des intervalles haute intensité',
        'Maintenez une récupération adéquate'
      ],
      source: 'garmin',
      deviceId: this.deviceInfo.deviceId,
      syncTime: new Date().toISOString()
    };
  }

  /**
   * Récupérer les données de stress
   * @param {string} date - Date au format YYYY-MM-DD
   * @returns {Promise<Object>} - Données de stress
   */
  async getStressData(date = null) {
    if (!this.isConnected) {
      throw new Error('Garmin Connect non connecté');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Génération de données de stress réalistes
    const stressData = [];
    for (let hour = 8; hour < 22; hour++) { // Stress mesuré uniquement en journée
      let stressLevel = 25; // Niveau de base
      
      // Pics de stress simulés
      if (hour >= 9 && hour <= 11) stressLevel += 20; // Matinée de travail
      if (hour >= 14 && hour <= 16) stressLevel += 15; // Après-midi
      
      stressLevel += (Math.random() - 0.5) * 20;
      stressLevel = Math.max(0, Math.min(100, stressLevel));
      
      stressData.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        level: Math.round(stressLevel)
      });
    }

    return {
      date: targetDate,
      averageStress: Math.round(stressData.reduce((sum, d) => sum + d.level, 0) / stressData.length),
      maxStress: Math.max(...stressData.map(d => d.level)),
      restPeriods: 3, // Nombre de périodes de repos détectées
      stressScore: 72, // Score de gestion du stress sur 100
      hourlyData: stressData,
      relaxationTime: 45, // minutes de relaxation détectées
      source: 'garmin',
      deviceId: this.deviceInfo.deviceId,
      syncTime: new Date().toISOString()
    };
  }

  /**
   * Récupérer toutes les données de santé pour une date
   * @param {string} date - Date au format YYYY-MM-DD
   * @returns {Promise<Object>} - Toutes les données de santé
   */
  async getAllHealthData(date = null) {
    if (!this.isConnected) {
      throw new Error('Garmin Connect non connecté');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const [sleep, heartRate, bodyBattery, activity, vo2max, stress] = await Promise.all([
        this.getSleepData(targetDate),
        this.getHeartRateData(targetDate),
        this.getBodyBatteryData(targetDate),
        this.getActivityData(targetDate),
        this.getVO2MaxData(),
        this.getStressData(targetDate)
      ]);

      return {
        date: targetDate,
        device: this.deviceInfo,
        sleep,
        heartRate,
        bodyBattery,
        activity,
        vo2max,
        stress,
        source: 'garmin',
        syncTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données Garmin:', error);
      throw error;
    }
  }

  /**
   * Synchroniser les données avec le contexte utilisateur
   * @param {Function} updateUserContext - Fonction de mise à jour du contexte
   * @param {string} date - Date à synchroniser
   * @returns {Promise<boolean>} - Succès de la synchronisation
   */
  async syncToUserContext(updateUserContext, date = null) {
    try {
      console.log('🔄 Synchronisation des données Garmin...');
      
      const healthData = await this.getAllHealthData(date);
      
      // Transformer les données Garmin au format de l'application
      const transformedData = this.transformToAppFormat(healthData);
      
      // Mettre à jour le contexte utilisateur
      await updateUserContext(transformedData);
      
      console.log('✅ Données Garmin synchronisées avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur de synchronisation Garmin:', error);
      return false;
    }
  }

  /**
   * Transformer les données Garmin au format de l'application
   * @param {Object} garminData - Données brutes Garmin
   * @returns {Object} - Données formatées pour l'application
   */
  transformToAppFormat(garminData) {
    return {
      source: 'garmin',
      deviceInfo: garminData.device,
      metrics: {
        sleep: {
          value: garminData.sleep.totalSleepTime,
          max: 10,
          label: 'Sommeil',
          unit: 'h',
          status: this.getMetricStatus(garminData.sleep.sleepScore, 80),
          details: garminData.sleep
        },
        stress: {
          value: 10 - (garminData.stress.averageStress / 10), // Inverser pour que moins = mieux
          max: 10,
          label: 'Stress',
          unit: '/10',
          status: this.getMetricStatus(garminData.stress.stressScore, 70),
          details: garminData.stress
        },
        energy: {
          value: garminData.bodyBattery.currentLevel / 10,
          max: 10,
          label: 'Énergie',
          unit: '/10',
          status: this.getMetricStatus(garminData.bodyBattery.currentLevel, 70),
          details: garminData.bodyBattery
        },
        hydration: {
          value: 2.1, // Garmin ne mesure pas l'hydratation directement
          max: 3,
          label: 'Hydratation',
          unit: 'L',
          status: 'good',
          details: { note: 'Estimation basée sur l\'activité' }
        },
        activity: {
          value: garminData.activity.steps,
          max: 10000,
          label: 'Activité',
          unit: 'pas',
          status: this.getMetricStatus(garminData.activity.steps, 8000),
          details: garminData.activity
        }
      },
      healthScore: this.calculateHealthScore(garminData),
      lastUpdated: garminData.syncTime
    };
  }

  /**
   * Calculer le statut d'une métrique
   * @param {number} value - Valeur actuelle
   * @param {number} threshold - Seuil pour "good"
   * @returns {string} - Statut (poor, average, good, excellent)
   */
  getMetricStatus(value, threshold) {
    if (value >= threshold * 1.2) return 'excellent';
    if (value >= threshold) return 'good';
    if (value >= threshold * 0.7) return 'average';
    return 'poor';
  }

  /**
   * Calculer le score de santé global
   * @param {Object} data - Données de santé complètes
   * @returns {number} - Score sur 100
   */
  calculateHealthScore(data) {
    const sleepScore = (data.sleep.sleepScore || 70);
    const stressScore = (data.stress.stressScore || 70);
    const energyScore = (data.bodyBattery.averageLevel || 70);
    const activityScore = Math.min(100, (data.activity.steps / 10000) * 100);
    
    return Math.round((sleepScore + stressScore + energyScore + activityScore) / 4);
  }

  /**
   * Déconnecter Garmin Connect
   */
  disconnect() {
    this.isConnected = false;
    this.deviceInfo = null;
    this.lastSync = null;
    console.log('🔌 Déconnecté de Garmin Connect');
  }

  /**
   * Obtenir le statut de la connexion
   * @returns {Object} - Informations de statut
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      deviceInfo: this.deviceInfo,
      lastSync: this.lastSync
    };
  }
}

// Instance singleton
const garminBridge = new GarminBridge();

export default garminBridge;
