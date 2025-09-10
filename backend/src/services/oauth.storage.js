/**
 * Service de stockage temporaire pour OAuth 2.0 + PKCE
 * Gère state, code_verifier et protection anti-double usage
 */
class OAuthStorageService {
  constructor() {
    // Stockage temporaire state -> { codeVerifier, timestamp, requestId }
    this.pendingAuths = new Map();
    
    // Protection anti-double usage des codes d'autorisation
    this.usedCodes = new Set();
    
    // Nettoyage automatique toutes les 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
    
    console.log('🔧 OAuthStorageService initialisé');
  }

  /**
   * Stocke les données PKCE pour un state donné
   * @param {string} state - Token state OAuth
   * @param {string} codeVerifier - Code verifier PKCE
   * @param {string} requestId - ID unique de la requête
   */
  storePKCEData(state, codeVerifier, requestId) {
    this.pendingAuths.set(state, {
      codeVerifier,
      requestId,
      timestamp: Date.now()
    });
    
    console.log(`[${requestId}] 💾 Données PKCE stockées pour state: ${state.substring(0, 8)}...`);
  }

  /**
   * Récupère et supprime les données PKCE pour un state
   * @param {string} state - Token state OAuth
   * @returns {Object|null} { codeVerifier, requestId, timestamp } ou null
   */
  retrievePKCEData(state) {
    const data = this.pendingAuths.get(state);
    if (data) {
      this.pendingAuths.delete(state);
      console.log(`[${data.requestId}] 📤 Données PKCE récupérées pour state: ${state.substring(0, 8)}...`);
      return data;
    }
    
    console.log(`❌ Aucune donnée PKCE trouvée pour state: ${state.substring(0, 8)}...`);
    return null;
  }

  /**
   * Marque un code d'autorisation comme utilisé
   * @param {string} code - Code d'autorisation OAuth
   * @param {string} requestId - ID de la requête
   */
  markCodeAsUsed(code, requestId) {
    this.usedCodes.add(code);
    console.log(`[${requestId}] 🔒 Code d'autorisation marqué comme utilisé: ${code.substring(0, 8)}...`);
  }

  /**
   * Vérifie si un code d'autorisation a déjà été utilisé
   * @param {string} code - Code d'autorisation OAuth
   * @returns {boolean} True si déjà utilisé
   */
  isCodeUsed(code) {
    return this.usedCodes.has(code);
  }

  /**
   * Nettoie les données expirées (> 10 minutes)
   */
  cleanup() {
    const now = Date.now();
    const expireTime = 10 * 60 * 1000; // 10 minutes
    
    let cleanedStates = 0;
    let cleanedCodes = 0;

    // Nettoyer les states expirés
    for (const [state, data] of this.pendingAuths.entries()) {
      if (now - data.timestamp > expireTime) {
        this.pendingAuths.delete(state);
        cleanedStates++;
      }
    }

    // Nettoyer les codes utilisés (garder seulement 1 heure)
    if (this.usedCodes.size > 1000) { // Limite arbitraire
      this.usedCodes.clear();
      cleanedCodes = this.usedCodes.size;
    }

    if (cleanedStates > 0 || cleanedCodes > 0) {
      console.log(`🧹 Nettoyage OAuth: ${cleanedStates} states expirés, ${cleanedCodes} codes nettoyés`);
    }
  }

  /**
   * Statistiques du stockage
   * @returns {Object} Statistiques actuelles
   */
  getStats() {
    return {
      pendingAuths: this.pendingAuths.size,
      usedCodes: this.usedCodes.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Nettoie toutes les données (pour les tests)
   */
  clear() {
    this.pendingAuths.clear();
    this.usedCodes.clear();
    console.log('🗑️ Stockage OAuth nettoyé');
  }

  /**
   * Ferme le service et nettoie les intervalles
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    console.log('🔥 OAuthStorageService détruit');
  }
}

// Instance singleton
let instance = null;

module.exports = {
  OAuthStorageService,
  getInstance: () => {
    if (!instance) {
      instance = new OAuthStorageService();
    }
    return instance;
  }
};
