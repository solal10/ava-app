const securityUtils = require('../../src/utils/security.utils');

describe('Security Utils', () => {
  describe('getJWTSecret', () => {
    const originalEnv = process.env.JWT_SECRET;

    afterEach(() => {
      process.env.JWT_SECRET = originalEnv;
    });

    it('devrait retourner le secret JWT depuis l\'environnement', () => {
      process.env.JWT_SECRET = 'test-secret-key';
      const secret = securityUtils.getJWTSecret();
      expect(secret).toBe('test-secret-key');
    });

    it('devrait générer un secret aléatoire si JWT_SECRET n\'est pas défini', () => {
      delete process.env.JWT_SECRET;
      const secret = securityUtils.getJWTSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });
  });

  describe('validateJWTSecret', () => {
    it('devrait valider un secret sécurisé', () => {
      const strongSecret = 'this-is-a-very-long-and-secure-secret-key-for-testing';
      const result = securityUtils.validateJWTSecret(strongSecret);
      expect(result.valid).toBe(true);
      expect(result.reason).toBe('Secret sécurisé');
    });

    it('devrait rejeter un secret trop court', () => {
      const shortSecret = 'short';
      const result = securityUtils.validateJWTSecret(shortSecret);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('trop court');
    });

    it('devrait rejeter un secret par défaut', () => {
      const defaultSecret = 'default_secret_key';
      const result = securityUtils.validateJWTSecret(defaultSecret);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('secret par défaut');
    });
  });

  describe('generateRandomSecret', () => {
    it('devrait générer un secret aléatoire', () => {
      const secret = securityUtils.generateRandomSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(30);
    });

    it('devrait générer des secrets différents à chaque appel', () => {
      const secret1 = securityUtils.generateRandomSecret();
      const secret2 = securityUtils.generateRandomSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('hashPassword', () => {
    it('devrait hasher un mot de passe', async () => {
      const password = 'testpassword123';
      const hashedPassword = await securityUtils.hashPassword(password);
      
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(password.length);
    });

    it('devrait produire des hash différents pour le même mot de passe', async () => {
      const password = 'testpassword123';
      const hash1 = await securityUtils.hashPassword(password);
      const hash2 = await securityUtils.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('devrait valider un mot de passe correct', async () => {
      const password = 'testpassword123';
      const hashedPassword = await securityUtils.hashPassword(password);
      
      const isValid = await securityUtils.comparePassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('devrait rejeter un mot de passe incorrect', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await securityUtils.hashPassword(password);
      
      const isValid = await securityUtils.comparePassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('devrait nettoyer les entrées dangereuses', () => {
      const dangerousInput = '<script>alert("xss")</script>Hello';
      const sanitized = securityUtils.sanitizeInput(dangerousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello');
    });

    it('devrait préserver le texte safe', () => {
      const safeInput = 'Hello World! This is safe text.';
      const sanitized = securityUtils.sanitizeInput(safeInput);
      
      expect(sanitized).toBe(safeInput);
    });
  });
});