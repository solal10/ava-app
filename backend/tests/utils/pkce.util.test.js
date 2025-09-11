const { generateCodeVerifier, generateCodeChallenge, generateState } = require('../../src/utils/pkce.util');

describe('PKCE Utils', () => {
  describe('generateCodeVerifier', () => {
    it('devrait générer un code verifier valide', () => {
      const verifier = generateCodeVerifier();
      
      expect(typeof verifier).toBe('string');
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
      expect(verifier).toMatch(/^[A-Za-z0-9._~-]+$/);
    });

    it('devrait générer des verifiers différents', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('devrait générer un code challenge à partir d\'un verifier', () => {
      const verifier = 'test-code-verifier-123456789';
      const challenge = generateCodeChallenge(verifier);
      
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(0);
      expect(challenge).not.toBe(verifier);
    });

    it('devrait générer le même challenge pour le même verifier', () => {
      const verifier = 'consistent-verifier-123456789';
      const challenge1 = generateCodeChallenge(verifier);
      const challenge2 = generateCodeChallenge(verifier);
      
      expect(challenge1).toBe(challenge2);
    });

    it('devrait être URL-safe', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      
      expect(challenge).toMatch(/^[A-Za-z0-9._~-]+$/);
    });
  });

  describe('generateState', () => {
    it('devrait générer un state valide', () => {
      const state = generateState();
      
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(10);
      expect(state).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('devrait générer des states différents', () => {
      const state1 = generateState();
      const state2 = generateState();
      
      expect(state1).not.toBe(state2);
    });

    it('devrait accepter une longueur personnalisée', () => {
      const customLength = 20;
      const state = generateState(customLength);
      
      expect(state.length).toBe(customLength * 2); // hex string
    });
  });

  describe('intégration PKCE complète', () => {
    it('devrait créer un flow PKCE complet', () => {
      // Générer le verifier
      const verifier = generateCodeVerifier();
      
      // Générer le challenge
      const challenge = generateCodeChallenge(verifier);
      
      // Générer le state
      const state = generateState();
      
      // Vérifications
      expect(verifier).toBeDefined();
      expect(challenge).toBeDefined();
      expect(state).toBeDefined();
      
      expect(verifier).not.toBe(challenge);
      expect(verifier).not.toBe(state);
      expect(challenge).not.toBe(state);
    });
  });

  describe('validation des formats', () => {
    it('le code verifier devrait respecter les spécifications RFC 7636', () => {
      const verifier = generateCodeVerifier();
      
      // Longueur entre 43 et 128 caractères
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
      
      // Caractères autorisés: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
      expect(verifier).toMatch(/^[A-Za-z0-9._~-]+$/);
    });

    it('le code challenge devrait être en base64url', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      
      // Base64url ne contient pas de padding = et utilise - et _ au lieu de + et /
      expect(challenge).not.toContain('=');
      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
      expect(challenge).toMatch(/^[A-Za-z0-9._~-]+$/);
    });
  });
});