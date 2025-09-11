const emailService = require('../../src/services/email.service');
const fs = require('fs');
const path = require('path');

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: []
    }),
    verify: jest.fn().mockResolvedValue(true)
  }))
}));

// Mock User model
jest.mock('../../src/models/user.model', () => ({
  findById: jest.fn(),
  find: jest.fn()
}));

// Mock fs promises pour les templates
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn()
  },
  existsSync: jest.fn()
}));

const User = require('../../src/models/user.model');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    emailService.transporter = null;
    emailService.isInitialized = false;
    emailService.templates = new Map();
  });

  describe('initialization', () => {
    it('devrait s\'initialiser avec les credentials Gmail', async () => {
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'test-password';
      
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue(['welcome.html', 'health-report.html']);
      fs.promises.readFile.mockResolvedValue('<html>Template content</html>');

      const result = await emailService.initialize();
      expect(result).toBe(true);
      expect(emailService.isInitialized).toBe(true);
    });

    it('devrait s\'initialiser en mode simulation sans credentials', async () => {
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_APP_PASSWORD;
      
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue([]);

      const result = await emailService.initialize();
      expect(result).toBe(true);
      expect(emailService.isInitialized).toBe(true);
    });

    it('devrait créer les templates par défaut', async () => {
      fs.existsSync.mockReturnValue(false);
      fs.promises.mkdir.mockResolvedValue();
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.readdir.mockResolvedValue([]);

      await emailService.initialize();
      
      expect(fs.promises.mkdir).toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalledTimes(6); // 6 templates par défaut
    });
  });

  describe('sendEmail', () => {
    beforeEach(async () => {
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'test-password';
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue([]);
      await emailService.initialize();
    });

    it('devrait envoyer un email simple', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test content',
        html: '<p>Test content</p>'
      };

      const result = await emailService.sendEmail(emailData);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
    });

    it('devrait gérer les erreurs d\'envoi', async () => {
      emailService.transporter.sendMail.mockRejectedValue(new Error('Send failed'));

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test content'
      };

      const result = await emailService.sendEmail(emailData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Send failed');
    });
  });

  describe('sendTemplate', () => {
    beforeEach(async () => {
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'test-password';
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue([]);
      await emailService.initialize();
      
      // Ajouter un template de test
      emailService.templates.set('welcome', {
        subject: 'Bienvenue {{username}}!',
        html: '<h1>Bienvenue {{username}}!</h1><p>Email: {{email}}</p>'
      });
    });

    it('devrait envoyer un email avec template', async () => {
      const templateData = {
        to: 'user@example.com',
        template: 'welcome',
        variables: {
          username: 'TestUser',
          email: 'user@example.com'
        }
      };

      const result = await emailService.sendTemplate(templateData);
      
      expect(result.success).toBe(true);
      expect(emailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Bienvenue TestUser!',
          html: expect.stringContaining('TestUser')
        })
      );
    });

    it('devrait gérer les templates inexistants', async () => {
      const templateData = {
        to: 'user@example.com',
        template: 'nonexistent',
        variables: {}
      };

      const result = await emailService.sendTemplate(templateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Template non trouvé');
    });
  });

  describe('sendWelcomeEmail', () => {
    beforeEach(async () => {
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'test-password';
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue([]);
      await emailService.initialize();
    });

    it('devrait envoyer un email de bienvenue', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'NewUser',
        profile: { firstName: 'John', lastName: 'Doe' }
      };

      const result = await emailService.sendWelcomeEmail(userData);
      
      expect(result.success).toBe(true);
    });
  });

  describe('sendHealthReport', () => {
    beforeEach(async () => {
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'test-password';
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue([]);
      await emailService.initialize();
    });

    it('devrait envoyer un rapport de santé', async () => {
      const reportData = {
        user: {
          email: 'user@example.com',
          username: 'testuser',
          profile: { firstName: 'John' }
        },
        metrics: {
          steps: 8500,
          calories: 2100,
          sleepHours: 7.5,
          stressLevel: 30
        },
        insights: ['Bon progrès cette semaine!'],
        recommendations: ['Augmentez votre activité physique']
      };

      const result = await emailService.sendHealthReport(reportData);
      
      expect(result.success).toBe(true);
    });
  });

  describe('sendBulkEmails', () => {
    beforeEach(async () => {
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'test-password';
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue([]);
      await emailService.initialize();
    });

    it('devrait envoyer des emails en masse', async () => {
      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ];

      const emailData = {
        subject: 'Newsletter',
        text: 'Newsletter content',
        html: '<p>Newsletter content</p>'
      };

      const result = await emailService.sendBulkEmails(recipients, emailData);
      
      expect(result.success).toBe(true);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('devrait gérer les échecs partiels', async () => {
      emailService.transporter.sendMail
        .mockResolvedValueOnce({ messageId: 'msg1' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ messageId: 'msg3' });

      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ];

      const emailData = {
        subject: 'Test',
        text: 'Test content'
      };

      const result = await emailService.sendBulkEmails(recipients, emailData);
      
      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('getStatus', () => {
    it('devrait retourner le statut non initialisé', () => {
      const status = emailService.getStatus();
      
      expect(status.isInitialized).toBe(false);
      expect(status.provider).toBe('Aucun');
      expect(status.templatesLoaded).toBe(0);
    });

    it('devrait retourner le statut initialisé', async () => {
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'test-password';
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue([]);
      await emailService.initialize();

      const status = emailService.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.provider).toBe('Gmail');
    });
  });

  describe('template management', () => {
    beforeEach(async () => {
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue([]);
      await emailService.initialize();
    });

    it('devrait lister les templates disponibles', () => {
      emailService.templates.set('test1', { subject: 'Test 1' });
      emailService.templates.set('test2', { subject: 'Test 2' });

      const templates = emailService.getAvailableTemplates();
      
      expect(templates).toContain('test1');
      expect(templates).toContain('test2');
    });

    it('devrait vérifier l\'existence d\'un template', () => {
      emailService.templates.set('existing', { subject: 'Exists' });

      expect(emailService.hasTemplate('existing')).toBe(true);
      expect(emailService.hasTemplate('nonexistent')).toBe(false);
    });
  });

  describe('mode simulation', () => {
    beforeEach(async () => {
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_APP_PASSWORD;
      fs.existsSync.mockReturnValue(true);
      fs.promises.readdir.mockResolvedValue([]);
      await emailService.initialize();
    });

    it('devrait simuler l\'envoi d\'emails', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test content'
      };

      const result = await emailService.sendEmail(emailData);
      
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });
  });
});