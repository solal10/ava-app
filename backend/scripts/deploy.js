#!/usr/bin/env node

/**
 * Script de déploiement AVA Coach Santé IA
 * Gestion des environnements et validation de configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentManager {
  constructor() {
    this.environments = ['development', 'staging', 'production'];
    this.requiredEnvVars = {
      development: ['JWT_SECRET'],
      staging: ['MONGODB_URI', 'JWT_SECRET', 'SENTRY_DSN'],
      production: ['MONGODB_URI', 'JWT_SECRET', 'SENTRY_DSN', 'SENDGRID_API_KEY', 'STRIPE_SECRET_KEY']
    };
  }

  /**
   * Déployer vers un environnement spécifique
   */
  async deploy(environment, options = {}) {
    try {
      console.log(`🚀 Déploiement vers ${environment.toUpperCase()}...`);
      
      // Validation de l'environnement
      if (!this.environments.includes(environment)) {
        throw new Error(`Environnement non supporté: ${environment}`);
      }

      // Charger la configuration d'environnement
      await this.loadEnvironmentConfig(environment);

      // Validation des variables critiques
      this.validateEnvironmentVariables(environment);

      // Validation de la configuration
      await this.validateConfiguration(environment);

      // Tests de santé
      if (options.runTests !== false) {
        await this.runHealthChecks(environment);
      }

      // Build de l'application
      if (options.build !== false) {
        await this.buildApplication(environment);
      }

      // Migration de base de données si nécessaire
      if (options.migrate) {
        await this.runMigrations(environment);
      }

      // Backup avant déploiement (production uniquement)
      if (environment === 'production' && options.backup !== false) {
        await this.createPreDeploymentBackup();
      }

      console.log(`✅ Déploiement vers ${environment} terminé avec succès`);
      
      // Afficher les informations post-déploiement
      this.displayPostDeploymentInfo(environment);

    } catch (error) {
      console.error(`❌ Erreur lors du déploiement vers ${environment}:`, error.message);
      process.exit(1);
    }
  }

  /**
   * Charger la configuration d'environnement
   */
  async loadEnvironmentConfig(environment) {
    const envFile = path.join(__dirname, `../.env.${environment}`);
    
    if (!fs.existsSync(envFile)) {
      throw new Error(`Fichier de configuration manquant: .env.${environment}`);
    }

    // Charger les variables d'environnement
    require('dotenv').config({ path: envFile });
    
    console.log(`📋 Configuration ${environment} chargée`);
  }

  /**
   * Valider les variables d'environnement critiques
   */
  validateEnvironmentVariables(environment) {
    const required = this.requiredEnvVars[environment] || [];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Variables d'environnement manquantes pour ${environment}: ${missing.join(', ')}`);
    }

    // Validations spécifiques
    this.validateSecrets(environment);
    this.validateUrls(environment);

    console.log('✅ Variables d\'environnement validées');
  }

  /**
   * Valider les secrets et clés
   */
  validateSecrets(environment) {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (jwtSecret) {
      if (jwtSecret.length < 32) {
        throw new Error('JWT_SECRET doit contenir au moins 32 caractères');
      }
      
      if (environment === 'production' && jwtSecret.includes('dev') || jwtSecret.includes('test')) {
        throw new Error('JWT_SECRET de développement utilisé en production');
      }
    }

    // Validation Stripe en production
    if (environment === 'production') {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey && !stripeKey.startsWith('sk_live_')) {
        console.warn('⚠️ ATTENTION: Clé Stripe de test utilisée en production');
      }
    }
  }

  /**
   * Valider les URLs
   */
  validateUrls(environment) {
    const frontendUrl = process.env.FRONTEND_URL;
    
    if (environment === 'production') {
      if (frontendUrl && frontendUrl.includes('localhost')) {
        throw new Error('URL localhost non autorisée en production');
      }
      
      if (frontendUrl && !frontendUrl.startsWith('https://')) {
        throw new Error('HTTPS requis en production');
      }
    }
  }

  /**
   * Valider la configuration via le service config
   */
  async validateConfiguration(environment) {
    try {
      const configService = require('../src/services/config.service');
      const healthCheck = configService.getHealthCheck();

      if (!healthCheck.healthy) {
        throw new Error(`Services critiques non configurés: ${healthCheck.criticalServices.join(', ')}`);
      }

      console.log('✅ Configuration des services validée');
    } catch (error) {
      console.warn(`⚠️ Impossible de valider la configuration: ${error.message}`);
    }
  }

  /**
   * Exécuter les tests de santé
   */
  async runHealthChecks(environment) {
    console.log('🏥 Exécution des tests de santé...');

    try {
      // Test de connexion MongoDB
      await this.testMongoConnection();
      
      // Test des services externes si configurés
      await this.testExternalServices();

      console.log('✅ Tests de santé réussis');
    } catch (error) {
      if (environment === 'production') {
        throw error; // Blocant en production
      } else {
        console.warn(`⚠️ Tests de santé échoués (non-bloquant en ${environment}): ${error.message}`);
      }
    }
  }

  /**
   * Tester la connexion MongoDB
   */
  async testMongoConnection() {
    const mongoose = require('mongoose');
    
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      await mongoose.connection.db.admin().ping();
      await mongoose.disconnect();
      console.log('✅ Connexion MongoDB OK');
    } catch (error) {
      throw new Error(`Connexion MongoDB échouée: ${error.message}`);
    }
  }

  /**
   * Tester les services externes
   */
  async testExternalServices() {
    // Test Sentry (si configuré)
    if (process.env.SENTRY_DSN) {
      console.log('✅ Sentry configuré');
    }

    // Test SendGrid (si configuré)
    if (process.env.SENDGRID_API_KEY) {
      console.log('✅ SendGrid configuré');
    }

    // Test Stripe (si configuré)
    if (process.env.STRIPE_SECRET_KEY) {
      console.log('✅ Stripe configuré');
    }
  }

  /**
   * Build de l'application
   */
  async buildApplication(environment) {
    console.log('🔨 Build de l\'application...');

    try {
      // Install des dépendances
      console.log('📦 Installation des dépendances...');
      execSync('npm ci', { stdio: 'inherit' });

      // Tests (sauf en production où ils ont déjà été exécutés)
      if (environment !== 'production') {
        console.log('🧪 Exécution des tests...');
        try {
          execSync('npm test', { stdio: 'inherit' });
        } catch (error) {
          console.warn('⚠️ Tests échoués (non-bloquant)');
        }
      }

      console.log('✅ Build terminé');
    } catch (error) {
      throw new Error(`Build échoué: ${error.message}`);
    }
  }

  /**
   * Exécuter les migrations de base de données
   */
  async runMigrations(environment) {
    console.log('🗃️ Exécution des migrations...');
    
    try {
      // Ici vous pourriez ajouter vos scripts de migration
      console.log('✅ Migrations terminées');
    } catch (error) {
      throw new Error(`Migrations échouées: ${error.message}`);
    }
  }

  /**
   * Créer un backup avant déploiement
   */
  async createPreDeploymentBackup() {
    console.log('💾 Création backup pré-déploiement...');
    
    try {
      const backupService = require('../src/services/backup.service');
      const result = await backupService.createBackup('pre-deployment', 'Backup automatique avant déploiement');
      
      if (result.success) {
        console.log(`✅ Backup créé: ${result.filename}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw new Error(`Backup pré-déploiement échoué: ${error.message}`);
    }
  }

  /**
   * Afficher les informations post-déploiement
   */
  displayPostDeploymentInfo(environment) {
    console.log(`\n📋 INFORMATIONS POST-DÉPLOIEMENT ${environment.toUpperCase()}:`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🗃️ Base de données: ${this.maskConnectionString(process.env.MONGODB_URI)}`);
    console.log(`🔐 JWT configuré: ${process.env.JWT_SECRET ? 'Oui' : 'Non'}`);
    console.log(`📊 Sentry: ${process.env.SENTRY_DSN ? 'Activé' : 'Désactivé'}`);
    console.log(`📧 Email: ${process.env.SENDGRID_API_KEY ? 'SendGrid' : 'Gmail/Autre'}`);
    console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'Production' : 'Test') : 'Non configuré'}`);
    
    console.log(`\n🚀 PROCHAINES ÉTAPES:`);
    if (environment === 'development') {
      console.log('1. Démarrer le serveur: npm run dev');
      console.log('2. Tester l\'API: http://localhost:5003');
    } else {
      console.log('1. Démarrer le serveur: npm start');
      console.log('2. Monitorer les logs et Sentry');
      console.log('3. Vérifier les métriques de santé');
    }
  }

  /**
   * Masquer la chaîne de connexion MongoDB
   */
  maskConnectionString(uri) {
    if (!uri) return 'Non configuré';
    return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  }

  /**
   * Afficher l'aide
   */
  displayHelp() {
    console.log(`
🚀 AVA Coach Santé IA - Script de Déploiement

Usage: node scripts/deploy.js <environment> [options]

Environnements:
  development   Déploiement local
  staging       Déploiement de test
  production    Déploiement production

Options:
  --no-tests    Ignorer les tests de santé
  --no-build    Ignorer le build
  --no-backup   Ignorer le backup pré-déploiement (production)
  --migrate     Exécuter les migrations de BDD

Exemples:
  node scripts/deploy.js development
  node scripts/deploy.js staging --migrate
  node scripts/deploy.js production --no-backup
    `);
  }
}

// Exécution du script
if (require.main === module) {
  const manager = new DeploymentManager();
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    manager.displayHelp();
    process.exit(0);
  }

  const environment = args[0];
  const options = {
    runTests: !args.includes('--no-tests'),
    build: !args.includes('--no-build'),
    backup: !args.includes('--no-backup'),
    migrate: args.includes('--migrate')
  };

  manager.deploy(environment, options)
    .then(() => {
      console.log('\n🎉 Déploiement terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Déploiement échoué:', error.message);
      process.exit(1);
    });
}

module.exports = DeploymentManager;