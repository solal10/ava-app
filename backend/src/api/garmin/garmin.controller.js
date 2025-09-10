const crypto = require('crypto');
const GarminData = require('../../models/garmindata.model');

class GarminController {
  constructor() {
    // Configuration OAuth immuable et sécurisée
    this.config = {
      clientId: process.env.GARMIN_CLIENT_ID,
      clientSecret: process.env.GARMIN_CLIENT_SECRET,
      redirectUri: process.env.GARMIN_REDIRECT_URI || `${process.env.TUNNEL_URL}/auth/garmin/rappel`,
      authUrl: 'https://connect.garmin.com/oauth2Confirm',
      tokenUrl: 'https://diauth.garmin.com/di-oauth2-service/oauth/token',
      scopes: process.env.GARMIN_SCOPES || 'activity_api,health_api'
    };

    // Validation des variables d'environnement requises
    if (!this.config.clientId) {
      throw new Error('GARMIN_CLIENT_ID environment variable is required');
    }
    if (!this.config.clientSecret) {
      throw new Error('GARMIN_CLIENT_SECRET environment variable is required');
    }
    if (!this.config.redirectUri) {
      throw new Error('GARMIN_REDIRECT_URI or TUNNEL_URL environment variable is required');
    }
    
    // Cache pour les code_verifier (TTL 15min)
    this.codeVerifierCache = new Map();
    
    console.log('🔒 GarminController VERROUILLÉ - Configuration immuable chargée');
    console.log('🔗 REDIRECT_URI configuré:', this.config.redirectUri);
    
    // Nettoyage automatique du cache toutes les 15 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.codeVerifierCache.entries()) {
        if (now - value.timestamp > 15 * 60 * 1000) {
          this.codeVerifierCache.delete(key);
        }
      }
    }, 15 * 60 * 1000);
  }

  // Méthode OAuth - Initier la connexion Garmin
  async login(req, res) {
    try {
      const correlationId = crypto.randomBytes(4).toString('hex');
      console.log(`[${correlationId}] 🔗 GET /auth/garmin/login - Génération PKCE`);
      
      // Générer code_verifier et code_challenge PKCE
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = this.generateCodeChallenge(codeVerifier);
      const state = crypto.randomBytes(16).toString('hex');
      
      console.log(`[${correlationId}] 📏 code_verifier length: ${codeVerifier.length} (${codeVerifier.substring(0, 10)}...)`);
      console.log(`[${correlationId}] 🔐 code_challenge: ${codeChallenge.substring(0, 16)}...`);
      
      // Stocker le code_verifier avec TTL
      this.codeVerifierCache.set(state, {
        codeVerifier: codeVerifier,
        correlationId: correlationId,
        timestamp: Date.now()
      });
      
      // URL d'autorisation Garmin
      const authUrl = new URL(this.config.authUrl);
      authUrl.searchParams.set('client_id', this.config.clientId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', this.config.scopes);
      authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      
      console.log(`[${correlationId}] 🎯 STEP 1 - redirect_uri utilisé: ${this.config.redirectUri}`);
      console.log(`[${correlationId}] ✅ URL d'autorisation générée: ${authUrl.toString().substring(0, 120)}...`);
      
      res.redirect(authUrl.toString());
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'URL d\'autorisation:', error);
      res.status(500).json({ error: 'Erreur lors de la génération de l\'URL d\'autorisation' });
    }
  }

  // Méthode OAuth - Callback après autorisation
  async callback(req, res) {
    try {
      const { code, state } = req.query;
      const correlationId = crypto.randomBytes(4).toString('hex');
      
      console.log(`[callback-${correlationId}] 🔄 GET /auth/garmin/rappel`);
      console.log(`[callback-${correlationId}] 📥 Paramètres: code=${code?.substring(0, 8)}..., state=${state?.substring(0, 8)}...`);
      
      if (!code || !state) {
        return res.redirect('http://localhost:5173/auth/garmin/done?status=error&reason=missing_code_or_state');
      }
      
      // Récupérer le code_verifier depuis le cache
      const cachedData = this.codeVerifierCache.get(state);
      if (!cachedData) {
        console.log(`[callback-${correlationId}] ❌ State non trouvé ou expiré`);
        return res.redirect('http://localhost:5173/auth/garmin/done?status=error&reason=invalid_state');
      }
      
      // Marquer le code comme utilisé (sécurité)
      this.codeVerifierCache.delete(state);
      console.log(`[callback-${correlationId}] 🔒 Code marqué comme utilisé (TTL 15min)`);
      
      const originalCorrelationId = cachedData.correlationId;
      console.log(`[${originalCorrelationId}] ✅ State validé, récupération code_verifier`);
      
      // Échanger le code contre un token
      const tokenResult = await this.exchangeCodeForToken(code, cachedData.codeVerifier, originalCorrelationId);
      
      if (tokenResult.success) {
        console.log(`[${originalCorrelationId}] ✅ Token obtenu avec succès`);
        
        const tokenData = encodeURIComponent(JSON.stringify({
          access_token: tokenResult.data.access_token,
          expires_in: tokenResult.data.expires_in,
          timestamp: Date.now()
        }));
        
        res.redirect(`http://localhost:5173/auth/garmin/done?status=ok&message=tokens_stored&tokens=${tokenData}`);
      } else {
        console.log(`[${originalCorrelationId}] ❌ Échec échange token`);
        res.redirect(`http://localhost:5173/auth/garmin/done?status=error&reason=token_exchange_failed&http_status=${tokenResult.httpStatus}`);
      }
      
    } catch (error) {
      console.error(`Erreur callback:`, error.message);
      res.redirect('http://localhost:5173/auth/garmin/done?status=error&reason=internal_error');
    }
  }

  // 🎯 FONCTION RÉELLE : Récupération des données Garmin via API officielle
  async getHealthData(req, res) {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const userId = req.userId || req.query.userId;
      
      if (!accessToken) {
        return res.status(401).json({ 
          success: false,
          error: 'Token d\'accès Garmin requis' 
        });
      }

      console.log('🔄 RÉCUPÉRATION DONNÉES GARMIN VIA API OFFICIELLE');
      console.log('🔑 Token OAuth valide:', accessToken.substring(0, 20) + '...');
      console.log('👤 User ID:', userId);

      const garminAPIService = require('../../services/garmin-api.service');
      
      try {
        // Tentative de récupération des données réelles via API Garmin
        console.log('📡 Appel API Garmin en cours...');
        
        const realData = await garminAPIService.getComprehensiveHealthData(accessToken, {
          includeSleep: true,
          includeStress: true,
          includeActivity: true,
          dateRange: 7
        });

        console.log('✅ Données Garmin récupérées avec succès via API officielle');
        
        // Calculer le score de santé basé sur les vraies données
        const healthScore = this.calculateRealHealthScore(realData.data);
        
        return res.json({
          success: true,
          message: '🎯 Données Garmin réelles synchronisées via API officielle',
          data: {
            date: realData.data.health?.date || new Date().toISOString().split('T')[0],
            userId: userId,
            source: 'garmin_official_api',
            current: {
              steps: realData.data.health?.steps || 0,
              sleep: realData.data.sleep?.totalSleep || null,
              stress: realData.data.stress?.averageStressLevel || null,
              energy: realData.data.health?.bodyBattery || null,
              heartRate: realData.data.health?.heartRate?.resting || null,
              calories: realData.data.health?.calories || 0,
              distance: realData.data.health?.distance || 0,
              activeMinutes: realData.data.health?.activeMinutes || null
            },
            sleep: realData.data.sleep || null,
            stress: realData.data.stress || null,
            activities: realData.data.activities || [],
            healthScore: healthScore,
            sync: {
              lastSync: realData.timestamp,
              source: 'garmin_official_api',
              dataQuality: 'high',
              syncEnabled: true
            }
          }
        });

      } catch (apiError) {
        console.warn('⚠️ API Garmin indisponible, basculement vers données simulées:', apiError.message);
        
        // Fallback vers données simulées réalistes
        return await this.getFallbackHealthData(userId, res);
      }
      
      // Essayer plusieurs endpoints possibles
      const endpoints = [
        'https://connectapi.garmin.com/health/v1/user',
        'https://connectapi.garmin.com/activity/v1/activities',
        'https://apis.garmin.com/health/v1/user',
        'https://apis.garmin.com/activity/v1/activities'
      ];
      
      let userResponse = null;
      let workingEndpoint = null;
      
      for (const endpoint of endpoints) {
        console.log(`🔍 Testing: ${endpoint}`);
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });
          console.log(`📊 ${endpoint}: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            userResponse = response;
            workingEndpoint = endpoint;
            break;
          } else if (response.status !== 404) {
            // Si ce n'est pas une 404, gardons cette réponse pour debug
            userResponse = response;
            workingEndpoint = endpoint;
          }
        } catch (error) {
          console.log(`❌ ${endpoint}: ${error.message}`);
        }
      }
      
      if (!userResponse) {
        userResponse = await fetch('https://apis.garmin.com/ping', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        workingEndpoint = 'ping test';
      }
      
      console.log(`📊 User endpoint: ${userResponse.status} ${userResponse.statusText}`);
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('❌ Endpoints failed:', errorText);
        return res.status(userResponse.status).json({
          success: false,
          error: 'Aucun endpoint Garmin API fonctionnel trouvé',
          details: `HTTP ${userResponse.status}: ${errorText}`,
          endpoint: workingEndpoint || 'tous testés',
          note: 'L\'authentification OAuth fonctionne mais l\'accès API nécessite peut-être une approbation commerciale Garmin'
        });
      }
      
      const userData = await userResponse.json();
      console.log('✅ Utilisateur Garmin authentifié:', userData.displayName || 'Inconnu');
      
      // Récupérer les données des 30 derniers jours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      
      console.log(`📅 Période: ${startDate.toISOString().split('T')[0]} à ${endDate.toISOString().split('T')[0]}`);
      
      // Récupérer les données d'activité
      console.log('🧪 Test endpoint activity-api...');
      const dailiesUrl = `https://apis.garmin.com/activity-api/v1/activities?limit=30`;
      const dailiesResponse = await fetch(dailiesUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`📊 Dailies endpoint: ${dailiesResponse.status} ${dailiesResponse.statusText}`);
      if (!dailiesResponse.ok) {
        const errorText = await dailiesResponse.text();
        console.error('❌ Dailies endpoint failed:', errorText);
        return res.status(dailiesResponse.status).json({
          success: false,
          error: 'Impossible de récupérer les données d\'activité',
          details: `HTTP ${dailiesResponse.status}: ${errorText}`,
          endpoint: 'dailies'
        });
      }
      
      const dailiesData = await dailiesResponse.json();
      console.log(`✅ Données dailies: ${dailiesData.length} entrées récupérées`);
      
      if (!dailiesData || dailiesData.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Aucune donnée d\'activité trouvée',
          message: 'Vérifiez que votre montre Garmin synchronise correctement'
        });
      }
      
      // Données les plus récentes
      const latestData = dailiesData[dailiesData.length - 1];
      console.log(`📊 Dernière entrée: ${latestData.summaryDate}`);
      
      // Structurer les données pour AVA
      const garminData = {
        user: {
          displayName: userData.displayName,
          userId: userData.userId
        },
        current: {
          date: latestData.summaryDate,
          steps: latestData.totalSteps || 0,
          calories: latestData.totalKilocalories || 0,
          distance: Math.round((latestData.totalDistanceMeters || 0) / 1000 * 100) / 100,
          heartRate: latestData.restingHeartRateInBeatsPerMinute || null,
          maxHeartRate: latestData.maxHeartRateInBeatsPerMinute || null,
          bodyBattery: latestData.bodyBatteryChargedValue || null,
          vo2Max: latestData.vo2Max || null,
          floorsClimbed: latestData.floorsAscended || 0,
          stressLevel: latestData.averageStressLevel || null
        },
        sleep: {
          duration: latestData.sleepTimeInSeconds ? Math.round(latestData.sleepTimeInSeconds / 3600 * 10) / 10 : null,
          quality: latestData.sleepQualityTypeName || null,
          deepSleep: latestData.deepSleepTimeInSeconds ? Math.round(latestData.deepSleepTimeInSeconds / 3600 * 10) / 10 : null,
          lightSleep: latestData.lightSleepTimeInSeconds ? Math.round(latestData.lightSleepTimeInSeconds / 3600 * 10) / 10 : null,
          remSleep: latestData.remSleepTimeInSeconds ? Math.round(latestData.remSleepTimeInSeconds / 3600 * 10) / 10 : null
        },
        activity: {
          vigorousMinutes: latestData.vigorousIntensityDurationInSeconds ? Math.round(latestData.vigorousIntensityDurationInSeconds / 60) : 0,
          moderateMinutes: latestData.moderateIntensityDurationInSeconds ? Math.round(latestData.moderateIntensityDurationInSeconds / 60) : 0,
          totalActiveMinutes: Math.round(((latestData.vigorousIntensityDurationInSeconds || 0) + (latestData.moderateIntensityDurationInSeconds || 0)) / 60)
        },
        healthScore: this.calculateHealthScore(latestData),
        history: dailiesData.slice(-7).map(day => ({
          date: day.summaryDate,
          steps: day.totalSteps || 0,
          calories: day.totalKilocalories || 0,
          sleepHours: day.sleepTimeInSeconds ? Math.round(day.sleepTimeInSeconds / 3600 * 10) / 10 : null,
          sleepQuality: day.sleepQualityTypeName,
          stressLevel: day.averageStressLevel || null,
          heartRate: day.restingHeartRateInBeatsPerMinute || null
        })),
        sync: {
          lastSync: new Date().toISOString(),
          source: 'garmin_wellness_api',
          dataCount: dailiesData.length,
          syncEnabled: true
        }
      };
      
      console.log('✅ Données Garmin authentiques structurées:', {
        user: garminData.user.displayName,
        steps: garminData.current.steps,
        healthScore: garminData.healthScore,
        historyDays: garminData.history.length
      });
      
      return res.status(200).json({
        success: true,
        data: garminData,
        message: `Données Garmin authentiques de ${garminData.user.displayName} synchronisées`
      });

    } catch (error) {
      console.error('❌ Erreur critique getHealthData:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données Garmin',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // 🎯 WEBHOOK - Recevoir les vraies données Garmin push avec traitement avancé
  async receiveWebhookData(req, res) {
    const garminWebhookService = require('../../services/garmin-webhook.service');
    return await garminWebhookService.processWebhookData(req, res);
  }

  // Enregistrer un webhook pour un utilisateur
  async registerUserWebhook(req, res) {
    try {
      const { userId, callbackUrl, eventTypes } = req.body;
      const garminWebhookService = require('../../services/garmin-webhook.service');
      
      if (!userId || !callbackUrl) {
        return res.status(400).json({
          error: 'userId et callbackUrl sont requis'
        });
      }

      garminWebhookService.registerWebhookEndpoint(userId, callbackUrl, eventTypes);
      
      return res.status(200).json({
        success: true,
        message: 'Webhook enregistré avec succès',
        userId: userId,
        callbackUrl: callbackUrl,
        eventTypes: eventTypes || ['health', 'activity', 'sleep']
      });

    } catch (error) {
      console.error('❌ Erreur enregistrement webhook:', error);
      return res.status(500).json({
        error: 'Erreur lors de l\'enregistrement du webhook'
      });
    }
  }

  // Obtenir le statut des webhooks pour un utilisateur
  async getWebhookStatus(req, res) {
    try {
      const userId = req.params.userId || req.userId;
      const garminWebhookService = require('../../services/garmin-webhook.service');
      
      const webhookInfo = garminWebhookService.webhookEndpoints.get(userId);
      
      if (!webhookInfo) {
        return res.status(404).json({
          success: false,
          message: 'Aucun webhook configuré pour cet utilisateur'
        });
      }

      return res.status(200).json({
        success: true,
        webhook: {
          userId: userId,
          callbackUrl: webhookInfo.callbackUrl,
          eventTypes: webhookInfo.eventTypes,
          isActive: webhookInfo.isActive,
          registeredAt: webhookInfo.registeredAt
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération statut webhook:', error);
      return res.status(500).json({
        error: 'Erreur lors de la récupération du statut webhook'
      });
    }
  }

  // Fallback vers données simulées quand API réelle indisponible
  async getFallbackHealthData(userId, res) {
    console.log('🔄 Tentative de récupération via service API Garmin en fallback');
    
    const garminAPIService = require('../../services/garmin-api.service');
    
    try {
      // Essayer d'utiliser les données par défaut du service au lieu de générer aléatoirement
      const defaultHealthData = garminAPIService.getDefaultHealthData();
      const defaultSleepData = garminAPIService.getDefaultSleepData();
      const defaultStressData = garminAPIService.getDefaultStressData();
      const defaultBodyBatteryData = garminAPIService.getDefaultBodyBatteryData();
      
      const today = new Date().toISOString().split('T')[0];
      
      return res.json({
        success: true,
        message: '⚠️ Utilisation des données par défaut - Token d\'accès requis pour API Garmin',
        data: {
          date: today,
          userId: userId,
          source: 'garmin_api_default',
          current: {
            steps: defaultHealthData.steps,
            sleep: defaultSleepData.totalSleep,
            stress: defaultStressData.averageStressLevel,
            energy: defaultBodyBatteryData.batteryLevel,
            heartRate: defaultHealthData.heartRate.resting,
            calories: defaultHealthData.calories,
            distance: defaultHealthData.distance,
            activeMinutes: defaultHealthData.activeMinutes
          },
          healthScore: 0, // Score non calculable sans vraies données
          sleep: defaultSleepData,
          stress: defaultStressData,
          bodyBattery: defaultBodyBatteryData,
          history: [], // Historique vide sans vraies données
          sync: {
            lastSync: new Date().toISOString(),
            source: 'garmin_api_service',
            dataQuality: 'default_values',
            syncEnabled: true,
            note: 'Service prêt - Token d\'accès Garmin requis pour données réelles'
          },
          note: 'Connectez votre compte Garmin pour accéder aux vraies données de santé'
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur dans le fallback:', error.message);
      
      // En dernier recours, retourner une structure vide mais valide
      return res.status(503).json({
        success: false,
        error: 'Service Garmin temporairement indisponible',
        data: {
          date: new Date().toISOString().split('T')[0],
          userId: userId,
          source: 'service_unavailable',
          note: 'Veuillez réessayer plus tard'
        }
      });
    }
  }

  // Calculer le score de santé basé sur les vraies données Garmin
  calculateRealHealthScore(data) {
    if (!data || !data.health) return 0; // Pas de données = pas de score
    
    let score = 0;
    let totalWeight = 0;
    
    // Score basé sur les pas (20%)
    if (data.health.steps && data.health.steps > 0) {
      const stepScore = Math.min(100, (data.health.steps / 10000) * 100);
      score += stepScore * 0.20;
      totalWeight += 0.20;
    }
    
    // Score basé sur le sommeil (20%)
    if (data.sleep && data.sleep.totalSleep && data.sleep.totalSleep > 0) {
      const sleepHours = data.sleep.totalSleep;
      let sleepScore = 0;
      if (sleepHours >= 7 && sleepHours <= 9) sleepScore = 100;
      else if (sleepHours >= 6 && sleepHours <= 10) sleepScore = 80;
      else if (sleepHours >= 5) sleepScore = 60;
      else sleepScore = 40;
      
      score += sleepScore * 0.20;
      totalWeight += 0.20;
    }
    
    // Score basé sur le stress (20%)
    if (data.stress && data.stress.averageStressLevel !== null && data.stress.averageStressLevel !== undefined) {
      const stressLevel = data.stress.averageStressLevel;
      const stressScore = Math.max(0, 100 - (stressLevel * 1.5)); // Stress 0-67 donne score 100-0
      score += stressScore * 0.20;
      totalWeight += 0.20;
    }
    
    // Score basé sur l'activité (20%)
    if (data.health.activeMinutes && data.health.activeMinutes.total > 0) {
      const activityScore = Math.min(100, (data.health.activeMinutes.total / 30) * 100);
      score += activityScore * 0.20;
      totalWeight += 0.20;
    }
    
    // Score basé sur Body Battery / énergie (20%)
    if (data.health.bodyBattery !== null && data.health.bodyBattery !== undefined) {
      const energyScore = data.health.bodyBattery; // Body Battery est déjà un score 0-100
      score += energyScore * 0.20;
      totalWeight += 0.20;
    }
    
    // Normaliser le score en fonction du poids total des métriques disponibles
    if (totalWeight > 0) {
      score = (score / totalWeight) * 100;
    } else {
      return 0; // Aucune métrique valide
    }
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  // Calculer le score de santé basé sur les données Garmin
  calculateHealthScore(data) {
    if (!data) return 75;
    
    let score = 0;
    let factors = 0;
    
    // Score basé sur les pas (25%)
    if (data.totalSteps) {
      const stepScore = Math.min(100, (data.totalSteps / 10000) * 100);
      score += stepScore * 0.25;
      factors++;
    }
    
    // Score basé sur le sommeil (25%)
    if (data.sleepTimeInSeconds) {
      const sleepHours = data.sleepTimeInSeconds / 3600;
      const sleepScore = sleepHours >= 7 && sleepHours <= 9 ? 100 : 
                       sleepHours >= 6 ? 80 : 60;
      score += sleepScore * 0.25;
      factors++;
    }
    
    // Score basé sur le stress (25%)
    if (data.averageStressLevel !== undefined) {
      const stressScore = Math.max(0, 100 - data.averageStressLevel);
      score += stressScore * 0.25;
      factors++;
    }
    
    // Score basé sur l'activité (25%)
    if (data.vigorousIntensityDurationInSeconds || data.moderateIntensityDurationInSeconds) {
      const totalActivityMinutes = ((data.vigorousIntensityDurationInSeconds || 0) + 
                                   (data.moderateIntensityDurationInSeconds || 0)) / 60;
      const activityScore = Math.min(100, (totalActivityMinutes / 30) * 100);
      score += activityScore * 0.25;
      factors++;
    }
    
    // Ajuster si on n'a pas tous les facteurs
    if (factors > 0) {
      score = (score / (factors * 0.25)) * 100;
    } else {
      score = 75; // Score par défaut
    }
    
    return Math.round(Math.max(50, Math.min(100, score)));
  }

  // Méthodes utilitaires PKCE
  generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }

  generateCodeChallenge(codeVerifier) {
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  }

  // Échange code contre token
  async exchangeCodeForToken(code, codeVerifier, correlationId) {
    console.log(`[${correlationId}] 🔄 Échange code->token (UNE SEULE FOIS)`);
    
    try {
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        code_verifier: codeVerifier,
        redirect_uri: this.config.redirectUri
      });
      
      console.log(`[${correlationId}] 📤 POST ${this.config.tokenUrl}`);
      console.log(`[${correlationId}] 📤 grant_type=authorization_code, client_id=${this.config.clientId}`);
      console.log(`[${correlationId}] 📤 redirect_uri=${this.config.redirectUri}`);
      console.log(`[${correlationId}] 📤 code_verifier=${codeVerifier.substring(0, 10)}... (${codeVerifier.length} chars)`);
      
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'AVA-GarminOAuth/1.0'
        },
        body: tokenParams.toString()
      });
      
      console.log(`[${correlationId}] 📥 HTTP ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const tokenData = await response.json();
        console.log(`[${correlationId}] ✅ TOKEN OBTENU:`);
        console.log(`[${correlationId}] ✅ access_token: ${tokenData.access_token?.substring(0, 20)}...`);
        console.log(`[${correlationId}] ✅ token_type: ${tokenData.token_type}`);
        console.log(`[${correlationId}] ✅ expires_in: ${tokenData.expires_in}s`);
        
        return { success: true, data: tokenData };
      } else {
        const errorText = await response.text();
        console.error(`[${correlationId}] ❌ Erreur token: ${response.status} - ${errorText}`);
        return { success: false, httpStatus: response.status, error: errorText };
      }
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Exception lors de l'échange token:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Méthode pour sauvegarder les données Garmin dans la base
  async saveGarminData(userId, activityData, healthData) {
    try {
      const garminData = new GarminData({
        userId: userId,
        date: new Date(),
        activities: activityData?.activities || [],
        heartRate: healthData?.heartRate,
        sleep: healthData?.sleep,
        stress: healthData?.stress,
        steps: healthData?.steps,
        calories: healthData?.calories,
        bodyBattery: healthData?.bodyBattery,
        syncedAt: new Date()
      });

      await garminData.save();
      console.log(`✅ Données Garmin sauvegardées pour l'utilisateur ${userId}`);
      return { success: true, data: garminData };
    } catch (error) {
      console.error(`❌ Erreur sauvegarde données Garmin:`, error);
      return { success: false, error: error.message };
    }
  }

  // Méthode pour récupérer les données Garmin d'un utilisateur
  async getUserGarminData(userId, fromDate, toDate) {
    try {
      const query = { userId };
      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate);
        if (toDate) query.date.$lte = new Date(toDate);
      }

      const data = await GarminData.find(query).sort({ date: -1 }).limit(30);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Erreur récupération données Garmin:`, error);
      return { success: false, error: error.message };
    }
  }

  // === MÉTHODES WEBHOOK ===

  // Recevoir les données webhook de Garmin (endpoint principal)
  async receiveWebhookData(req, res) {
    try {
      console.log('📨 Webhook Garmin reçu');
      
      const garminWebhookService = require('../../services/garmin-webhook.service');
      await garminWebhookService.processWebhookData(req, res);
      
    } catch (error) {
      console.error('❌ Erreur webhook principal:', error.message);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du webhook',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Enregistrer un webhook pour un utilisateur
  async registerUserWebhook(req, res) {
    try {
      const { userId, callbackUrl, eventTypes } = req.body;
      
      if (!userId || !callbackUrl) {
        return res.status(400).json({
          success: false,
          error: 'userId et callbackUrl requis'
        });
      }

      const garminWebhookService = require('../../services/garmin-webhook.service');
      garminWebhookService.registerWebhookEndpoint(userId, callbackUrl, eventTypes);
      
      res.json({
        success: true,
        message: 'Webhook enregistré avec succès',
        userId,
        callbackUrl,
        eventTypes: eventTypes || ['health', 'activity', 'sleep'],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erreur enregistrement webhook:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Obtenir le statut des webhooks pour un utilisateur
  async getWebhookStatus(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId requis'
        });
      }

      // Récupérer les dernières données webhook pour cet utilisateur
      const recentData = await GarminData.find({
        userId,
        source: 'webhook_realtime'
      })
      .sort({ syncTimestamp: -1 })
      .limit(10);

      const lastWebhook = recentData.length > 0 ? recentData[0].syncTimestamp : null;
      
      res.json({
        success: true,
        userId,
        webhookStatus: {
          isActive: recentData.length > 0,
          lastReceived: lastWebhook,
          recentDataCount: recentData.length,
          dataTypes: [...new Set(recentData.map(d => d.dataType))]
        },
        recentWebhooks: recentData.map(d => ({
          dataType: d.dataType,
          receivedAt: d.syncTimestamp,
          hasData: !!d.data
        }))
      });

    } catch (error) {
      console.error('❌ Erreur statut webhook:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Obtenir les statistiques des webhooks
  async getWebhookStats(req, res) {
    try {
      const timeRange = parseInt(req.query.hours) || 24;
      
      const garminWebhookService = require('../../services/garmin-webhook.service');
      const stats = await garminWebhookService.getWebhookStats(timeRange);
      
      res.json({
        success: true,
        ...stats
      });

    } catch (error) {
      console.error('❌ Erreur stats webhook:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Tester la connectivité des webhooks
  async testWebhookConnectivity(req, res) {
    try {
      const garminWebhookService = require('../../services/garmin-webhook.service');
      const status = await garminWebhookService.testWebhookConnectivity();
      
      res.json({
        success: true,
        ...status
      });

    } catch (error) {
      console.error('❌ Erreur test webhook:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new GarminController();