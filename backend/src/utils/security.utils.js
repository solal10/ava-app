const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecurityUtils {
  constructor() {
    this.secretsPath = path.join(process.cwd(), '.secrets');
    this.ensureSecretsDirectory();
  }

  // Créer le répertoire secrets s'il n'existe pas
  ensureSecretsDirectory() {
    if (!fs.existsSync(this.secretsPath)) {
      fs.mkdirSync(this.secretsPath, { mode: 0o700 });
    }
  }

  // Générer un secret JWT cryptographiquement sécurisé
  generateJWTSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Obtenir ou générer le secret JWT principal
  getJWTSecret() {
    const secretFile = path.join(this.secretsPath, 'jwt.secret');
    
    // Si la variable d'environnement existe et n'est pas le défaut non-sécurisé
    if (process.env.JWT_SECRET && 
        process.env.JWT_SECRET !== 'your-super-secret-jwt-key-change-this-in-production' && 
        process.env.JWT_SECRET !== 'secret-dev-only') {
      return process.env.JWT_SECRET;
    }

    // Sinon, essayer de lire depuis le fichier
    try {
      if (fs.existsSync(secretFile)) {
        const secret = fs.readFileSync(secretFile, 'utf8').trim();
        if (secret.length >= 64) { // Minimum 64 caractères pour un secret sécurisé
          return secret;
        }
      }
    } catch (error) {
      console.warn('Impossible de lire le fichier secret JWT:', error.message);
    }

    // Générer un nouveau secret sécurisé
    console.log('🔒 Génération d\'un nouveau secret JWT sécurisé...');
    const newSecret = this.generateJWTSecret();
    
    try {
      fs.writeFileSync(secretFile, newSecret, { mode: 0o600 });
      console.log('✅ Secret JWT généré et sauvegardé dans', secretFile);
      console.log('⚠️  IMPORTANT: Ajoutez ce secret à votre variable d\'environnement JWT_SECRET');
      console.log('⚠️  Secret généré (à copier): JWT_SECRET=' + newSecret);
    } catch (error) {
      console.error('❌ Impossible de sauvegarder le secret:', error.message);
    }

    return newSecret;
  }

  // Système de rotation des secrets (pour implémentation future)
  rotateJWTSecret() {
    const currentSecret = this.getJWTSecret();
    const newSecret = this.generateJWTSecret();
    const rotationFile = path.join(this.secretsPath, 'jwt.rotation');
    
    const rotationData = {
      current: newSecret,
      previous: currentSecret,
      rotatedAt: new Date().toISOString()
    };

    try {
      fs.writeFileSync(rotationFile, JSON.stringify(rotationData, null, 2), { mode: 0o600 });
      console.log('🔄 Rotation du secret JWT effectuée');
      return newSecret;
    } catch (error) {
      console.error('❌ Erreur lors de la rotation:', error.message);
      return currentSecret;
    }
  }

  // Valider qu'un secret JWT est suffisamment sécurisé
  validateJWTSecret(secret) {
    if (!secret || typeof secret !== 'string') {
      return { valid: false, reason: 'Secret manquant ou invalide' };
    }

    if (secret.length < 32) {
      return { valid: false, reason: 'Secret trop court (minimum 32 caractères)' };
    }

    if (secret === 'secret-dev-only' || 
        secret === 'your-super-secret-jwt-key-change-this-in-production') {
      return { valid: false, reason: 'Secret par défaut non-sécurisé détecté' };
    }

    // Vérifier la complexité
    const hasNumbers = /\d/.test(secret);
    const hasLetters = /[a-zA-Z]/.test(secret);
    
    if (!hasNumbers || !hasLetters) {
      return { valid: false, reason: 'Secret insuffisamment complexe' };
    }

    return { valid: true, reason: 'Secret valide' };
  }

  // Générer une clé d'API sécurisée
  generateAPIKey(prefix = 'ava') {
    const randomPart = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${randomPart}`;
  }

  // Hash sécurisé pour les mots de passe
  async hashPassword(password) {
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Vérifier un hash de mot de passe
  async verifyPassword(password, hash) {
    const bcrypt = require('bcrypt');
    return await bcrypt.compare(password, hash);
  }
}

module.exports = new SecurityUtils();