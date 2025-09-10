const crypto = require('crypto');

/**
 * Utilitaire PKCE pour OAuth 2.0 Authorization Code Flow
 * Génère code_verifier et code_challenge selon RFC 7636
 */
class PKCEUtil {
  /**
   * Génère un code_verifier aléatoire (43-128 caractères)
   * @param {number} length - Longueur souhaitée (43-128)
   * @returns {string} Code verifier en base64url
   */
  static generateCodeVerifier(length = 43) {
    if (length < 43 || length > 128) {
      throw new Error('Code verifier length must be between 43 and 128 characters');
    }
    
    // Générer bytes aléatoires et encoder en base64url
    const buffer = crypto.randomBytes(Math.ceil(length * 3 / 4));
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, length);
  }

  /**
   * Génère le code_challenge à partir du code_verifier
   * @param {string} codeVerifier - Code verifier
   * @returns {string} Code challenge en base64url (SHA256)
   */
  static generateCodeChallenge(codeVerifier) {
    if (!codeVerifier || typeof codeVerifier !== 'string') {
      throw new Error('Code verifier must be a non-empty string');
    }

    // SHA256 hash du code verifier
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    
    // Encoder en base64url
    return hash
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Génère une paire complète PKCE
   * @param {number} verifierLength - Longueur du verifier (43-128)
   * @returns {Object} { codeVerifier, codeChallenge, codeChallengeMethod }
   */
  static generatePKCEPair(verifierLength = 43) {
    const codeVerifier = this.generateCodeVerifier(verifierLength);
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    
    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  /**
   * Génère un state sécurisé pour OAuth
   * @param {number} length - Longueur en bytes (défaut: 32)
   * @returns {string} State en hexadécimal
   */
  static generateState(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Valide un code verifier selon RFC 7636
   * @param {string} codeVerifier - Code verifier à valider
   * @returns {boolean} True si valide
   */
  static validateCodeVerifier(codeVerifier) {
    if (!codeVerifier || typeof codeVerifier !== 'string') {
      return false;
    }

    // Longueur entre 43 et 128 caractères
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      return false;
    }

    // Caractères autorisés: [A-Z] [a-z] [0-9] - . _ ~
    const validChars = /^[A-Za-z0-9\-._~]+$/;
    return validChars.test(codeVerifier);
  }
}

module.exports = PKCEUtil;
