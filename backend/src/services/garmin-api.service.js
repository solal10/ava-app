const axios = require('axios');

class GarminAPIService {
  constructor() {
    this.baseURL = 'https://apis.garmin.com';
    this.connectURL = 'https://connectapi.garmin.com';
    this.rateLimitDelay = 1000; // 1 seconde entre les requêtes
    this.lastRequestTime = 0;
    this.maxRetries = 3;
    
    // Configuration des endpoints mis à jour (2024)
    this.endpoints = {
      health: '/wellness-api/rest/dailies',
      activities: '/activity-search-service-1.2/json/activities',
      sleep: '/wellness-api/rest/sleepData',
      stress: '/wellness-api/rest/stressDetails',
      heartRate: '/wellness-api/rest/heartRate',
      bodyBattery: '/wellness-api/rest/bodyBattery'
    };
    
    // Headers par défaut pour toutes les requêtes
    this.defaultHeaders = {
      'Accept': 'application/json',
      'User-Agent': 'AVA-Coach/2.0',
      'di-backend': 'connectapi.garmin.com'
    };
  }

  // Rate limiting pour respecter les limites de l'API Garmin
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Retry logic pour les requêtes échouées
  async retryRequest(requestFn, maxRetries = this.maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.log(`Garmin API attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw new Error(`Garmin API failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff
        const backoffTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }

  // Obtenir les données de santé journalières
  async getDailyHealthData(accessToken, date = null) {
    await this.waitForRateLimit();

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    return await this.retryRequest(async () => {
      const response = await axios.get(`${this.connectURL}${this.endpoints.health}`, {
        params: {
          uploadStartTimeInGMT: targetDate,
          uploadEndTimeInGMT: targetDate
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          ...this.defaultHeaders
        },
        timeout: 10000
      });

      console.log(`✅ Données de santé récupérées pour ${targetDate}:`, {
        status: response.status,
        dataPoints: response.data?.length || 0
      });

      return this.formatHealthData(response.data);
    });
  }

  // Obtenir les données d'activité
  async getActivityData(accessToken, startDate = null, endDate = null) {
    await this.waitForRateLimit();

    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    return await this.retryRequest(async () => {
      const response = await axios.get(`${this.connectURL}${this.endpoints.activities}`, {
        params: {
          startDate: start,
          endDate: end,
          limit: 50
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          ...this.defaultHeaders
        },
        timeout: 15000
      });

      console.log(`✅ Données d'activité récupérées pour ${start} à ${end}:`, {
        status: response.status,
        activities: response.data?.length || 0
      });

      return this.formatActivityData(response.data);
    });
  }

  // Obtenir les données de Body Battery (énergie corporelle)
  async getBodyBatteryData(accessToken, date = null) {
    await this.waitForRateLimit();

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    return await this.retryRequest(async () => {
      const response = await axios.get(`${this.connectURL}${this.endpoints.bodyBattery}`, {
        params: {
          date: targetDate
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          ...this.defaultHeaders
        },
        timeout: 10000
      });

      console.log(`✅ Données Body Battery récupérées pour ${targetDate}:`, {
        status: response.status,
        hasData: !!response.data
      });

      return this.formatBodyBatteryData(response.data);
    });
  }

  // Obtenir les données de sommeil
  async getSleepData(accessToken, date = null) {
    await this.waitForRateLimit();

    const targetDate = date || new Date().toISOString().split('T')[0];

    return await this.retryRequest(async () => {
      const response = await axios.get(`${this.connectURL}/wellness-api/v1/dailies`, {
        params: {
          date: targetDate
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'AVA-Coach/1.0'
        },
        timeout: 10000
      });

      return this.formatSleepData(response.data);
    });
  }

  // Obtenir les données de stress
  async getStressData(accessToken, date = null) {
    await this.waitForRateLimit();

    const targetDate = date || new Date().toISOString().split('T')[0];

    return await this.retryRequest(async () => {
      const response = await axios.get(`${this.connectURL}/wellness-api/v1/dailies`, {
        params: {
          date: targetDate,
          metrics: 'stressLevel'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'AVA-Coach/1.0'
        },
        timeout: 10000
      });

      return this.formatStressData(response.data);
    });
  }

  // Obtenir les données complètes d'un utilisateur
  async getComprehensiveHealthData(accessToken, options = {}) {
    const {
      includeSleep = true,
      includeStress = true,
      includeActivity = true,
      includeBodyBattery = true,
      dateRange = 7 // derniers N jours
    } = options;

    console.log('🔄 Récupération complète des données Garmin...', options);

    try {
      const promises = [];

      // Données de santé de base
      promises.push(this.getDailyHealthData(accessToken));

      // Body Battery (énergie corporelle)
      if (includeBodyBattery) {
        promises.push(this.getBodyBatteryData(accessToken));
      }

      // Données de sommeil
      if (includeSleep) {
        promises.push(this.getSleepData(accessToken));
      }

      // Données de stress
      if (includeStress) {
        promises.push(this.getStressData(accessToken));
      }

      // Données d'activité
      if (includeActivity) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        
        promises.push(this.getActivityData(accessToken, startDate, endDate));
      }

      const results = await Promise.allSettled(promises);
      
      console.log('📊 Résultats récupération Garmin:', {
        promises: promises.length,
        success: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
      });

      return this.combineHealthData(results, {
        includeSleep,
        includeStress,
        includeActivity,
        includeBodyBattery
      });

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données complètes:', error);
      throw error;
    }
  }

  // Formater les données de santé
  formatHealthData(rawData) {
    if (!rawData || !rawData.dailies || rawData.dailies.length === 0) {
      return this.getDefaultHealthData();
    }

    const latest = rawData.dailies[0];
    
    return {
      date: latest.summaryDate || new Date().toISOString().split('T')[0],
      steps: latest.totalSteps || 0,
      calories: latest.totalKilocalories || 0,
      distance: Math.round((latest.totalDistanceMeters || 0) / 1000 * 100) / 100,
      heartRate: {
        resting: latest.restingHeartRateInBeatsPerMinute || null,
        max: latest.maxHeartRateInBeatsPerMinute || null,
        average: latest.averageHeartRateInBeatsPerMinute || null
      },
      bodyBattery: latest.bodyBatteryChargedValue || null,
      vo2Max: latest.vo2Max || null,
      floorsClimbed: latest.floorsAscended || 0,
      activeMinutes: {
        vigorous: Math.round((latest.vigorousIntensityDurationInSeconds || 0) / 60),
        moderate: Math.round((latest.moderateIntensityDurationInSeconds || 0) / 60),
        total: Math.round(((latest.vigorousIntensityDurationInSeconds || 0) + 
                         (latest.moderateIntensityDurationInSeconds || 0)) / 60)
      },
      source: 'garmin_health_api',
      lastSync: new Date().toISOString()
    };
  }

  // Formater les données d'activité
  formatActivityData(rawData) {
    if (!rawData || !rawData.activities) {
      return [];
    }

    return rawData.activities.map(activity => ({
      id: activity.activityId,
      name: activity.activityName,
      type: activity.activityTypeDTO?.typeKey || 'unknown',
      startTime: activity.startTimeLocal,
      duration: activity.durationInSeconds,
      distance: activity.distanceInMeters ? Math.round(activity.distanceInMeters / 1000 * 100) / 100 : null,
      calories: activity.caloriesConsumed || null,
      averageHeartRate: activity.averageHeartRateInBeatsPerMinute || null,
      maxHeartRate: activity.maxHeartRateInBeatsPerMinute || null,
      averageSpeed: activity.averageSpeedInMetersPerSecond || null,
      elevationGain: activity.elevationGainInMeters || null
    }));
  }

  // Formater les données de sommeil
  formatSleepData(rawData) {
    if (!rawData || !rawData.dailies || rawData.dailies.length === 0) {
      return this.getDefaultSleepData();
    }

    const latest = rawData.dailies[0];
    
    return {
      date: latest.summaryDate || new Date().toISOString().split('T')[0],
      totalSleep: latest.sleepTimeInSeconds ? Math.round(latest.sleepTimeInSeconds / 3600 * 10) / 10 : null,
      deepSleep: latest.deepSleepTimeInSeconds ? Math.round(latest.deepSleepTimeInSeconds / 3600 * 10) / 10 : null,
      lightSleep: latest.lightSleepTimeInSeconds ? Math.round(latest.lightSleepTimeInSeconds / 3600 * 10) / 10 : null,
      remSleep: latest.remSleepTimeInSeconds ? Math.round(latest.remSleepTimeInSeconds / 3600 * 10) / 10 : null,
      awakeDuration: latest.awakeDurationInSeconds ? Math.round(latest.awakeDurationInSeconds / 60) : null,
      sleepQuality: latest.sleepQualityTypeName || null,
      sleepScore: latest.sleepScore || null,
      restfulnessValue: latest.restfulnessValue || null
    };
  }

  // Formater les données de stress
  formatStressData(rawData) {
    if (!rawData || !rawData.dailies || rawData.dailies.length === 0) {
      return this.getDefaultStressData();
    }

    const latest = rawData.dailies[0];
    
    return {
      date: latest.summaryDate || new Date().toISOString().split('T')[0],
      averageStressLevel: latest.averageStressLevel || null,
      maxStressLevel: latest.maxStressLevel || null,
      stressDuration: latest.stressDurationInSeconds ? Math.round(latest.stressDurationInSeconds / 60) : null,
      restStressLevel: latest.restStressLevel || null,
      activityStressLevel: latest.activityStressLevel || null,
      stressQualifier: latest.stressQualifier || null
    };
  }

  // Combiner toutes les données de santé
  combineHealthData(results, options) {
    const combined = {
      success: true,
      source: 'garmin_real_api',
      timestamp: new Date().toISOString(),
      data: {}
    };

    let resultIndex = 0;

    // Données de santé de base (toujours présentes)
    if (results[resultIndex].status === 'fulfilled') {
      combined.data.health = results[resultIndex].value;
    } else {
      combined.data.health = this.getDefaultHealthData();
      console.warn('Échec récupération données santé:', results[resultIndex].reason);
    }
    resultIndex++;

    // Données de sommeil
    if (options.includeSleep) {
      if (results[resultIndex].status === 'fulfilled') {
        combined.data.sleep = results[resultIndex].value;
      } else {
        combined.data.sleep = this.getDefaultSleepData();
        console.warn('Échec récupération données sommeil:', results[resultIndex].reason);
      }
      resultIndex++;
    }

    // Données de stress
    if (options.includeStress) {
      if (results[resultIndex].status === 'fulfilled') {
        combined.data.stress = results[resultIndex].value;
      } else {
        combined.data.stress = this.getDefaultStressData();
        console.warn('Échec récupération données stress:', results[resultIndex].reason);
      }
      resultIndex++;
    }

    // Données d'activité
    if (options.includeActivity) {
      if (results[resultIndex].status === 'fulfilled') {
        combined.data.activities = results[resultIndex].value;
      } else {
        combined.data.activities = [];
        console.warn('Échec récupération données activité:', results[resultIndex].reason);
      }
    }

    return combined;
  }

  // Données par défaut en cas d'échec API
  getDefaultHealthData() {
    return {
      date: new Date().toISOString().split('T')[0],
      steps: 0,
      calories: 0,
      distance: 0,
      heartRate: { resting: null, max: null, average: null },
      bodyBattery: null,
      vo2Max: null,
      floorsClimbed: 0,
      activeMinutes: { vigorous: 0, moderate: 0, total: 0 },
      source: 'fallback',
      lastSync: new Date().toISOString()
    };
  }

  getDefaultSleepData() {
    return {
      date: new Date().toISOString().split('T')[0],
      totalSleep: null,
      deepSleep: null,
      lightSleep: null,
      remSleep: null,
      awakeDuration: null,
      sleepQuality: null,
      sleepScore: null,
      restfulnessValue: null
    };
  }

  getDefaultStressData() {
    return {
      date: new Date().toISOString().split('T')[0],
      averageStressLevel: null,
      maxStressLevel: null,
      stressDuration: null,
      restStressLevel: null,
      activityStressLevel: null,
      stressQualifier: null
    };
  }

  // Formater les données de Body Battery (énergie corporelle)
  formatBodyBatteryData(rawData) {
    if (!rawData || (!Array.isArray(rawData) && !rawData.bodyBatteryValues)) {
      return this.getDefaultBodyBatteryData();
    }

    const batteryData = Array.isArray(rawData) ? rawData : rawData.bodyBatteryValues;
    
    if (!batteryData || batteryData.length === 0) {
      return this.getDefaultBodyBatteryData();
    }

    // Calculer les statistiques à partir des données de la journée
    const values = batteryData.map(entry => entry.value || entry.bodyBatteryLevel).filter(v => v !== null);
    
    return {
      date: new Date().toISOString().split('T')[0],
      batteryLevel: values.length > 0 ? values[values.length - 1] : null,
      lowestLevel: values.length > 0 ? Math.min(...values) : null,
      highestLevel: values.length > 0 ? Math.max(...values) : null,
      averageLevel: values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null,
      dataPoints: batteryData.length,
      rawTimeSeries: batteryData.slice(0, 50), // Limiter pour éviter les réponses trop lourdes
      lastSync: new Date().toISOString()
    };
  }

  getDefaultBodyBatteryData() {
    return {
      date: new Date().toISOString().split('T')[0],
      batteryLevel: null,
      lowestLevel: null,
      highestLevel: null,
      averageLevel: null,
      dataPoints: 0,
      rawTimeSeries: [],
      lastSync: new Date().toISOString()
    };
  }
}

module.exports = new GarminAPIService();