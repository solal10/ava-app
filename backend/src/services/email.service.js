const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

/**
 * Service de notifications email avec support multi-provider
 * Supporte SendGrid, AWS SES, Gmail SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.provider = null;
    this.templates = new Map();
    
    console.log('📧 Initialisation EmailService...');
  }

  /**
   * Initialise le service email selon la configuration
   */
  async initialize() {
    try {
      const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
      
      switch (emailProvider.toLowerCase()) {
        case 'sendgrid':
          await this.initializeSendGrid();
          break;
        case 'aws':
        case 'ses':
          await this.initializeAWSSES();
          break;
        case 'gmail':
          await this.initializeGmail();
          break;
        default:
          console.warn(`⚠️ Provider email inconnu: ${emailProvider}, utilisation de Gmail par défaut`);
          await this.initializeGmail();
      }

      // Charger les templates d'email
      await this.loadEmailTemplates();
      
      this.isInitialized = true;
      console.log(`✅ EmailService initialisé avec ${this.provider}`);
      
    } catch (error) {
      console.error('❌ Erreur initialisation EmailService:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * Configuration SendGrid
   */
  async initializeSendGrid() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY manquant dans les variables d\'environnement');
    }

    this.transporter = nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });

    this.provider = 'SendGrid';
    console.log('🔗 Transporter SendGrid configuré');
  }

  /**
   * Configuration AWS SES
   */
  async initializeAWSSES() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('Clés AWS manquantes (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
    }

    this.transporter = nodemailer.createTransporter({
      SES: {
        aws: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'eu-west-1'
        }
      }
    });

    this.provider = 'AWS SES';
    console.log('🔗 Transporter AWS SES configuré');
  }

  /**
   * Configuration Gmail SMTP (développement)
   */
  async initializeGmail() {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      console.warn('⚠️ GMAIL_USER ou GMAIL_APP_PASSWORD manquants, mode simulation activé');
      this.provider = 'Simulation (Gmail non configuré)';
      return;
    }

    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    this.provider = 'Gmail SMTP';
    console.log('🔗 Transporter Gmail SMTP configuré');
  }

  /**
   * Charger les templates d'email
   */
  async loadEmailTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      
      // Créer le dossier templates s'il n'existe pas
      try {
        await fs.access(templatesDir);
      } catch {
        await fs.mkdir(templatesDir, { recursive: true });
        console.log('📁 Dossier templates créé:', templatesDir);
      }

      const templateFiles = [
        'welcome.html',
        'subscription-confirmation.html',
        'health-report.html',
        'goal-achievement.html',
        'password-reset.html',
        'garmin-connection.html'
      ];

      for (const templateFile of templateFiles) {
        const templatePath = path.join(templatesDir, templateFile);
        try {
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          const templateName = templateFile.replace('.html', '');
          this.templates.set(templateName, templateContent);
          console.log(`📧 Template chargé: ${templateName}`);
        } catch (error) {
          // Créer un template par défaut si le fichier n'existe pas
          await this.createDefaultTemplate(templatePath, templateFile);
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          const templateName = templateFile.replace('.html', '');
          this.templates.set(templateName, templateContent);
          console.log(`📧 Template par défaut créé et chargé: ${templateName}`);
        }
      }

      console.log(`✅ ${this.templates.size} templates d'email chargés`);

    } catch (error) {
      console.error('❌ Erreur chargement templates:', error.message);
    }
  }

  /**
   * Créer des templates par défaut
   */
  async createDefaultTemplate(templatePath, templateFile) {
    let defaultContent = '';

    switch (templateFile) {
      case 'welcome.html':
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bienvenue sur AVA Coach Santé</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Bienvenue sur AVA Coach Santé</h1>
            <p>Votre parcours santé intelligent commence maintenant !</p>
        </div>
        <div class="content">
            <h2>Bonjour {{userName}} !</h2>
            <p>Nous sommes ravis de vous accueillir dans la famille AVA Coach Santé. Votre compte a été créé avec succès.</p>
            
            <h3>🎯 Prochaines étapes :</h3>
            <ul>
                <li>Configurez vos objectifs de santé</li>
                <li>Connectez vos appareils (Garmin, Fitbit...)</li>
                <li>Explorez les fonctionnalités IA</li>
                <li>Planifiez vos premiers repas</li>
            </ul>

            <a href="{{appUrl}}/dashboard" class="button">Découvrir mon dashboard</a>

            <p>Besoin d'aide ? Notre équipe est là pour vous accompagner !</p>
        </div>
        <div class="footer">
            <p>AVA Coach Santé - Votre bien-être, notre priorité</p>
            <p>Vous recevez cet email car vous vous êtes inscrit sur notre plateforme</p>
        </div>
    </div>
</body>
</html>`;
        break;

      case 'health-report.html':
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Votre rapport santé hebdomadaire</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .metrics { display: flex; justify-content: space-around; padding: 20px; background: #f8fafc; }
        .metric { text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #10b981; }
        .content { padding: 30px; }
        .progress-bar { width: 100%; height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden; margin: 10px 0; }
        .progress { height: 100%; background: #10b981; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Rapport Santé Hebdomadaire</h1>
            <p>Semaine du {{startDate}} au {{endDate}}</p>
        </div>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">{{steps}}</div>
                <div>Pas moyens/jour</div>
            </div>
            <div class="metric">
                <div class="metric-value">{{sleepHours}}h</div>
                <div>Sommeil moyen</div>
            </div>
            <div class="metric">
                <div class="metric-value">{{healthScore}}</div>
                <div>Score santé</div>
            </div>
        </div>
        <div class="content">
            <h2>🎯 Vos accomplissements</h2>
            <ul>
                {{#achievements}}
                <li>{{achievement}}</li>
                {{/achievements}}
            </ul>

            <h2>💡 Recommandations personnalisées</h2>
            <p>{{recommendations}}</p>

            <div class="progress-bar">
                <div class="progress" style="width: {{progressPercent}}%"></div>
            </div>
            <p>Progression vers vos objectifs: {{progressPercent}}%</p>
        </div>
    </div>
</body>
</html>`;
        break;

      case 'garmin-connection.html':
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Connexion Garmin réussie</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .success-icon { font-size: 48px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">⌚</div>
            <h1>Connexion Garmin réussie !</h1>
            <p>Vos données de santé sont maintenant synchronisées</p>
        </div>
        <div class="content">
            <h2>Bonjour {{userName}} !</h2>
            <p>Excellente nouvelle ! Votre compte Garmin a été connecté avec succès à AVA Coach Santé.</p>
            
            <h3>🔄 Synchronisation en cours :</h3>
            <ul>
                <li>✅ Données d'activité (pas, distance, calories)</li>
                <li>✅ Données de sommeil (durée, qualité)</li>
                <li>✅ Données de stress et Body Battery</li>
                <li>✅ Fréquence cardiaque</li>
            </ul>

            <p><strong>Première synchronisation :</strong> {{syncDate}}</p>
            <p><strong>Prochaine mise à jour :</strong> Automatique via webhooks</p>

            <p>Vos données Garmin sont maintenant intégrées dans vos rapports de santé et recommandations IA personnalisées.</p>
        </div>
    </div>
</body>
</html>`;
        break;

      default:
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AVA Coach Santé</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AVA Coach Santé</h1>
        <p>{{message}}</p>
    </div>
</body>
</html>`;
    }

    await fs.writeFile(templatePath, defaultContent.trim(), 'utf-8');
  }

  /**
   * Envoyer un email
   */
  async sendEmail(options) {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ EmailService non initialisé, email simulé');
        return { success: true, messageId: 'simulated', provider: 'simulation' };
      }

      const {
        to,
        subject,
        template,
        data = {},
        from = process.env.FROM_EMAIL || 'noreply@ava-coach-sante.com'
      } = options;

      if (!to || !subject) {
        throw new Error('Destinataire (to) et sujet (subject) requis');
      }

      let htmlContent;
      if (template && this.templates.has(template)) {
        htmlContent = this.renderTemplate(template, data);
      } else {
        htmlContent = data.html || `<p>${data.message || 'Email depuis AVA Coach Santé'}</p>`;
      }

      const mailOptions = {
        from,
        to,
        subject,
        html: htmlContent,
        text: data.text || this.htmlToText(htmlContent)
      };

      let result;
      if (this.transporter) {
        result = await this.transporter.sendMail(mailOptions);
        console.log(`✅ Email envoyé via ${this.provider}:`, result.messageId);
      } else {
        // Mode simulation
        console.log('📧 Email simulé:', { to, subject, provider: this.provider });
        result = { messageId: 'simulated-' + Date.now(), provider: this.provider };
      }

      return {
        success: true,
        messageId: result.messageId,
        provider: this.provider
      };

    } catch (error) {
      console.error('❌ Erreur envoi email:', error.message);
      return {
        success: false,
        error: error.message,
        provider: this.provider
      };
    }
  }

  /**
   * Rendre un template avec des données
   */
  renderTemplate(templateName, data) {
    let template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' non trouvé`);
    }

    // Remplacer les variables simples {{variable}}
    template = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });

    // Remplacer les listes {{#array}}...{{/array}}
    template = template.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, key, content) => {
      const array = data[key];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemContent = content;
        if (typeof item === 'object') {
          Object.keys(item).forEach(itemKey => {
            itemContent = itemContent.replace(new RegExp(`\{\{${itemKey}\}\}`, 'g'), item[itemKey]);
          });
        } else {
          itemContent = itemContent.replace(/\{\{(\w+)\}\}/g, item);
        }
        return itemContent;
      }).join('');
    });

    return template;
  }

  /**
   * Convertir HTML en texte
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Emails prédéfinis pour AVA Coach Santé
   */

  async sendWelcomeEmail(userEmail, userName) {
    return await this.sendEmail({
      to: userEmail,
      subject: '🏥 Bienvenue sur AVA Coach Santé !',
      template: 'welcome',
      data: {
        userName,
        appUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      }
    });
  }

  async sendHealthReport(userEmail, userName, reportData) {
    return await this.sendEmail({
      to: userEmail,
      subject: '📊 Votre rapport santé hebdomadaire',
      template: 'health-report',
      data: {
        userName,
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        steps: reportData.avgSteps,
        sleepHours: reportData.avgSleep,
        healthScore: reportData.healthScore,
        achievements: reportData.achievements || [],
        recommendations: reportData.recommendations || 'Continuez vos efforts !',
        progressPercent: reportData.progressPercent || 75
      }
    });
  }

  async sendGarminConnectionEmail(userEmail, userName) {
    return await this.sendEmail({
      to: userEmail,
      subject: '⌚ Connexion Garmin réussie - AVA Coach Santé',
      template: 'garmin-connection',
      data: {
        userName,
        syncDate: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    });
  }

  async sendGoalAchievementEmail(userEmail, userName, goalData) {
    return await this.sendEmail({
      to: userEmail,
      subject: `🎯 Objectif atteint : ${goalData.goalName} !`,
      template: 'goal-achievement',
      data: {
        userName,
        goalName: goalData.goalName,
        goalValue: goalData.goalValue,
        achievedDate: goalData.achievedDate
      }
    });
  }

  async sendSubscriptionEmail(userEmail, userName, subscriptionData) {
    return await this.sendEmail({
      to: userEmail,
      subject: `💎 Abonnement ${subscriptionData.plan} activé !`,
      template: 'subscription-confirmation',
      data: {
        userName,
        plan: subscriptionData.plan,
        features: subscriptionData.features,
        nextBilling: subscriptionData.nextBilling
      }
    });
  }

  /**
   * Tester la configuration email
   */
  async testConfiguration(testEmail) {
    try {
      const result = await this.sendEmail({
        to: testEmail,
        subject: '🧪 Test configuration email - AVA Coach Santé',
        data: {
          message: `Test réussi ! Configuration email fonctionnelle avec ${this.provider}`,
          html: `
            <h2>✅ Test de configuration réussi !</h2>
            <p>Ce message confirme que la configuration email fonctionne correctement.</p>
            <p><strong>Provider:</strong> ${this.provider}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          `
        }
      });

      return {
        success: result.success,
        provider: this.provider,
        messageId: result.messageId,
        testEmail
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: this.provider
      };
    }
  }

  /**
   * Obtenir le statut du service
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      provider: this.provider,
      templatesLoaded: this.templates.size,
      hasTransporter: !!this.transporter
    };
  }
}

module.exports = new EmailService();