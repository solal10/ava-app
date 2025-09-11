#!/usr/bin/env node

/**
 * Script d'aide à la configuration des environnements
 * AVA Coach Santé IA
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

class EnvironmentSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Configuration interactive d'un environnement
   */
  async setupEnvironment(environment) {
    console.log(`🔧 Configuration de l'environnement ${environment.toUpperCase()}`);
    
    try {
      const templatePath = path.join(__dirname, `../.env.${environment}`);
      const envPath = path.join(__dirname, '../.env');
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template d'environnement non trouvé: .env.${environment}`);
      }

      // Lire le template
      const template = fs.readFileSync(templatePath, 'utf-8');
      let config = template;

      console.log('\n📝 Configuration des variables critiques...\n');

      // JWT Secret
      const jwtSecret = await this.configureJwtSecret(environment);
      config = this.replaceInConfig(config, 'JWT_SECRET', jwtSecret);

      // MongoDB URI
      if (environment !== 'development') {
        const mongoUri = await this.configureMongoUri(environment);
        config = this.replaceInConfig(config, 'MONGODB_URI', mongoUri);
      }

      // Sentry DSN (staging/production)
      if (environment !== 'development') {
        const sentryDsn = await this.configureSentryDsn();
        if (sentryDsn) {
          config = this.replaceInConfig(config, 'SENTRY_DSN', sentryDsn);
        }
      }

      // Email configuration
      await this.configureEmail(environment, config);

      // Sauvegarder la configuration
      const targetPath = environment === 'development' ? envPath : `${envPath}.${environment}`;
      fs.writeFileSync(targetPath, config);

      console.log(`\n✅ Configuration sauvegardée: ${path.basename(targetPath)}`);
      
      // Afficher les prochaines étapes
      this.displayNextSteps(environment);

    } catch (error) {
      console.error(`❌ Erreur configuration ${environment}:`, error.message);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Configurer JWT Secret
   */
  async configureJwtSecret(environment) {
    console.log('🔐 Configuration JWT Secret');
    
    const question = environment === 'development' 
      ? 'Utiliser un JWT secret généré automatiquement ? (y/n): '
      : 'Entrez votre JWT secret sécurisé (64+ caractères): ';

    const answer = await this.ask(question);

    if (environment === 'development' && (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')) {
      return this.generateSecureSecret(64);
    } else {
      const secret = answer.trim();
      if (secret.length < 32) {
        console.warn('⚠️ ATTENTION: JWT secret trop court (< 32 caractères)');
      }
      return secret;
    }
  }

  /**
   * Configurer MongoDB URI
   */
  async configureMongoUri(environment) {
    console.log('🗃️ Configuration MongoDB');
    
    const question = environment === 'production'
      ? 'Entrez votre URI MongoDB Atlas (mongodb+srv://...): '
      : 'Entrez votre URI MongoDB: ';

    const uri = await this.ask(question);
    
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error('URI MongoDB invalide');
    }

    return uri.trim();
  }

  /**
   * Configurer Sentry DSN
   */
  async configureSentryDsn() {
    console.log('📊 Configuration Sentry (optionnel)');
    
    const answer = await this.ask('Entrez votre Sentry DSN (ou Enter pour ignorer): ');
    
    if (answer.trim()) {
      if (!answer.startsWith('https://') || !answer.includes('@sentry.io')) {
        console.warn('⚠️ Format Sentry DSN suspect');
      }
      return answer.trim();
    }

    return null;
  }

  /**
   * Configurer Email
   */
  async configureEmail(environment, config) {
    console.log('📧 Configuration Email');
    
    const provider = await this.ask('Provider email (gmail/sendgrid/aws): ');
    
    switch (provider.toLowerCase()) {
      case 'gmail':
        await this.configureGmail(config);
        break;
      case 'sendgrid':
        await this.configureSendGrid(config);
        break;
      case 'aws':
        await this.configureAWSSES(config);
        break;
      default:
        console.log('Provider non reconnu, configuration manuelle nécessaire');
    }
  }

  /**
   * Configurer Gmail
   */
  async configureGmail(config) {
    const email = await this.ask('Email Gmail: ');
    const password = await this.ask('Mot de passe d\'application Gmail: ');
    
    config = this.replaceInConfig(config, 'GMAIL_USER', email);
    config = this.replaceInConfig(config, 'GMAIL_APP_PASSWORD', password);
  }

  /**
   * Configurer SendGrid
   */
  async configureSendGrid(config) {
    const apiKey = await this.ask('Clé API SendGrid: ');
    config = this.replaceInConfig(config, 'SENDGRID_API_KEY', apiKey);
  }

  /**
   * Configurer AWS SES
   */
  async configureAWSSES(config) {
    const accessKey = await this.ask('AWS Access Key ID: ');
    const secretKey = await this.ask('AWS Secret Access Key: ');
    const region = await this.ask('AWS Region (défaut: eu-west-1): ') || 'eu-west-1';
    
    config = this.replaceInConfig(config, 'AWS_ACCESS_KEY_ID', accessKey);
    config = this.replaceInConfig(config, 'AWS_SECRET_ACCESS_KEY', secretKey);
    config = this.replaceInConfig(config, 'AWS_REGION', region);
  }

  /**
   * Générer un secret sécurisé
   */
  generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Remplacer une valeur dans la configuration
   */
  replaceInConfig(config, key, value) {
    const regex = new RegExp(`(${key}=).*`, 'g');
    return config.replace(regex, `$1${value}`);
  }

  /**
   * Poser une question à l'utilisateur
   */
  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Afficher les prochaines étapes
   */
  displayNextSteps(environment) {
    console.log('\n🚀 PROCHAINES ÉTAPES:');
    
    if (environment === 'development') {
      console.log('1. Installer les dépendances: npm install');
      console.log('2. Démarrer MongoDB local');
      console.log('3. Lancer l\'application: npm run dev');
      console.log('4. Tester: http://localhost:5003');
    } else {
      console.log('1. Valider la configuration: node scripts/deploy.js ' + environment + ' --no-build');
      console.log('2. Tester les connexions');
      console.log('3. Déployer: node scripts/deploy.js ' + environment);
    }

    console.log('\n📝 CONFIGURATION SUPPLÉMENTAIRE:');
    console.log('- Spoonacular API: SPOONACULAR_API_KEY');
    console.log('- Stripe: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY');
    console.log('- Garmin OAuth: GARMIN_CLIENT_ID, GARMIN_CLIENT_SECRET');
    console.log('- Firebase: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY');
    console.log('- AI APIs: OPENAI_API_KEY, ANTHROPIC_API_KEY');
  }

  /**
   * Valider un environnement existant
   */
  async validateEnvironment(environment) {
    console.log(`🔍 Validation de l'environnement ${environment.toUpperCase()}`);
    
    const envFile = path.join(__dirname, environment === 'development' ? '../.env' : `../.env.${environment}`);
    
    if (!fs.existsSync(envFile)) {
      console.error(`❌ Fichier de configuration non trouvé: ${path.basename(envFile)}`);
      return;
    }

    // Charger les variables
    require('dotenv').config({ path: envFile });

    // Vérifications critiques
    const issues = [];

    // JWT Secret
    if (!process.env.JWT_SECRET) {
      issues.push('JWT_SECRET manquant');
    } else if (process.env.JWT_SECRET.length < 32) {
      issues.push('JWT_SECRET trop court (< 32 caractères)');
    }

    // MongoDB
    if (!process.env.MONGODB_URI) {
      issues.push('MONGODB_URI manquant');
    } else if (!process.env.MONGODB_URI.startsWith('mongodb')) {
      issues.push('MONGODB_URI format invalide');
    }

    // Production specific
    if (environment === 'production') {
      if (!process.env.SENTRY_DSN) {
        issues.push('SENTRY_DSN manquant en production');
      }
      
      if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
        issues.push('Clé Stripe de test utilisée en production');
      }
      
      if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
        issues.push('URL localhost utilisée en production');
      }
    }

    // Afficher les résultats
    if (issues.length === 0) {
      console.log('✅ Configuration valide');
    } else {
      console.log('❌ Problèmes détectés:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    this.rl.close();
  }

  /**
   * Afficher l'aide
   */
  displayHelp() {
    console.log(`
🔧 AVA Coach Santé IA - Configuration Environnements

Usage: node scripts/env-setup.js <commande> [environnement]

Commandes:
  setup <env>      Configuration interactive d'un environnement
  validate <env>   Validation d'une configuration existante
  generate-secret  Générer un secret sécurisé

Environnements:
  development      Configuration locale
  staging          Configuration de test  
  production       Configuration production

Exemples:
  node scripts/env-setup.js setup development
  node scripts/env-setup.js validate production
  node scripts/env-setup.js generate-secret
    `);
  }

  /**
   * Générer un secret et l'afficher
   */
  generateSecret() {
    const secret = this.generateSecureSecret(64);
    console.log('🔐 Secret généré (64 caractères):');
    console.log(secret);
    this.rl.close();
  }
}

// Exécution du script
if (require.main === module) {
  const setup = new EnvironmentSetup();
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    setup.displayHelp();
    process.exit(0);
  }

  const command = args[0];
  const environment = args[1];

  switch (command) {
    case 'setup':
      if (!environment) {
        console.error('❌ Environnement requis pour setup');
        setup.displayHelp();
        process.exit(1);
      }
      setup.setupEnvironment(environment);
      break;
      
    case 'validate':
      if (!environment) {
        console.error('❌ Environnement requis pour validate');
        setup.displayHelp();
        process.exit(1);
      }
      setup.validateEnvironment(environment);
      break;
      
    case 'generate-secret':
      setup.generateSecret();
      break;
      
    default:
      console.error(`❌ Commande inconnue: ${command}`);
      setup.displayHelp();
      process.exit(1);
  }
}

module.exports = EnvironmentSetup;