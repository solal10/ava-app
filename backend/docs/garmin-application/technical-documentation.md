# AVA Coach - Technical Integration Documentation

## API Integration Overview

### Authentication Flow
```javascript
const crypto = require('crypto');

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
```

### Webhook Implementation
```javascript
// Webhook endpoint for real-time data sync
app.post('/api/garmin/webhook', (req, res) => {
  // Process incoming Garmin data
  // Update user health metrics
  // Trigger AI coaching recommendations
});
```

### Security Measures
- OAuth 2.0 + PKCE implementation
- JWT token management with rotation
- Rate limiting: 1000 requests per 15 minutes
- HTTPS encryption for all communications
- Data encryption at rest (AES-256)

### Error Handling
- Comprehensive retry logic for API failures
- Graceful degradation when Garmin services unavailable
- Detailed logging for debugging and monitoring
- User-friendly error messages

## Data Usage Patterns

### Health Data Collection
- Heart rate variability for stress analysis
- Sleep quality metrics for recovery coaching
- Activity data for personalized exercise recommendations
- Body battery for energy optimization

### Privacy Compliance
- GDPR Article 6 lawful basis: User consent
- Data minimization: Only collect necessary metrics
- User rights: Access, rectification, erasure, portability
- Data retention: Maximum 2 years, user-configurable

## Performance Metrics
- API response time: < 200ms average
- Uptime requirement: 99.9%
- Data synchronization: Real-time via webhooks
- User data processing: < 5 seconds
