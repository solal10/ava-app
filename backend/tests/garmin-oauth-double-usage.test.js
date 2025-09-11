const request = require('supertest');
const express = require('express');
const GarminController = require('../src/api/garmin/garmin.controller');

/**
 * Test unitaire/e2e pour protection anti-double usage
 * Simule 2 hits consécutifs sur /auth/garmin/rappel?code=XYZ
 * Le deuxième doit renvoyer status "duplicate" sans second POST /oauth/token
 */

describe('Garmin OAuth Anti-Double Usage Protection', () => {
  let app;
  let garminController;
  let mockFetch;
  
  beforeAll(() => {
    // Setup Express app pour tests
    app = express();
    garminController = new GarminController();
    
    // Routes de test
    app.get('/auth/garmin/login', (req, res) => garminController.login(req, res));
    app.get('/auth/garmin/rappel', (req, res) => garminController.rappel(req, res));
    
    // Mock fetch pour éviter vrais appels Garmin
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });
  
  beforeEach(() => {
    // Reset mocks et état
    mockFetch.mockClear();
    garminController.usedCodes.clear();
    garminController.pendingAuths.clear();
  });

  test('Premier appel callback doit réussir', async () => {
    // ARRANGE: Préparer state/verifier valide
    const testState = 'test-state-12345';
    const testCode = 'test-auth-code-67890';
    const testVerifier = 'test-code-verifier-abcdef';
    
    garminController.pendingAuths.set(testState, {
      verifier: testVerifier,
      correlationId: 'test-correlation-1',
      createdAt: Date.now()
    });
    
    // Mock réponse token success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      }))
    });
    
    // ACT: Premier appel callback
    const response1 = await request(app)
      .get('/auth/garmin/rappel')
      .query({ code: testCode, state: testState });
    
    // ASSERT: Premier appel réussit
    expect(response1.status).toBe(302);
    expect(response1.headers.location).toContain('/auth/garmin/done?status=ok');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(garminController.usedCodes.has(testCode)).toBe(true);
  });

  test('Deuxième appel avec même code doit être rejeté (DUPLICATE)', async () => {
    // ARRANGE: Préparer premier appel
    const testState1 = 'test-state-first';
    const testState2 = 'test-state-second';
    const testCode = 'same-auth-code-12345'; // MÊME CODE
    const testVerifier = 'test-verifier';
    
    // Préparer deux states différents mais même code
    garminController.pendingAuths.set(testState1, {
      verifier: testVerifier,
      correlationId: 'correlation-1',
      createdAt: Date.now()
    });
    
    garminController.pendingAuths.set(testState2, {
      verifier: testVerifier,
      correlationId: 'correlation-2', 
      createdAt: Date.now()
    });
    
    // Mock réponse token pour premier appel
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        access_token: 'mock-token',
        token_type: 'Bearer',
        expires_in: 3600
      }))
    });
    
    // ACT: Premier appel - doit réussir
    const response1 = await request(app)
      .get('/auth/garmin/rappel')
      .query({ code: testCode, state: testState1 });
    
    // ACT: Deuxième appel avec MÊME CODE - doit être rejeté
    const response2 = await request(app)
      .get('/auth/garmin/rappel')
      .query({ code: testCode, state: testState2 });
    
    // ASSERT: Premier appel OK
    expect(response1.status).toBe(302);
    expect(response1.headers.location).toContain('/auth/garmin/done?status=ok');
    
    // ASSERT: Deuxième appel DUPLICATE
    expect(response2.status).toBe(302);
    expect(response2.headers.location).toContain('/auth/garmin/done?status=duplicate');
    expect(response2.headers.location).toContain('reason=code_already_used');
    
    // ASSERT: Un seul appel fetch (pas de second POST /oauth/token)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // ASSERT: Code marqué comme utilisé
    expect(garminController.usedCodes.has(testCode)).toBe(true);
  });

  test('Appels simultanés avec même code - race condition protection', async () => {
    // ARRANGE: Préparer state valide
    const testState = 'test-state-race';
    const testCode = 'race-condition-code';
    const testVerifier = 'race-verifier';
    
    garminController.pendingAuths.set(testState, {
      verifier: testVerifier,
      correlationId: 'race-correlation',
      createdAt: Date.now()
    });
    
    // Mock réponse lente pour simuler race condition
    mockFetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          access_token: 'race-token',
          token_type: 'Bearer',
          expires_in: 3600
        }))
      }), 100))
    );
    
    // ACT: Deux appels simultanés
    const [response1, response2] = await Promise.all([
      request(app).get('/auth/garmin/rappel').query({ code: testCode, state: testState }),
      request(app).get('/auth/garmin/rappel').query({ code: testCode, state: testState })
    ]);
    
    // ASSERT: Un succès, un duplicate
    const responses = [response1, response2];
    const successCount = responses.filter(r => r.headers.location?.includes('status=ok')).length;
    const duplicateCount = responses.filter(r => r.headers.location?.includes('status=duplicate')).length;
    
    expect(successCount).toBe(1);
    expect(duplicateCount).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Un seul échange token
  });

  test('Code expiré/invalide ne doit pas être marqué comme utilisé', async () => {
    // ARRANGE: State invalide (pas dans pendingAuths)
    const testCode = 'invalid-code';
    const invalidState = 'invalid-state';
    
    // ACT: Appel avec state invalide
    const response = await request(app)
      .get('/auth/garmin/rappel')
      .query({ code: testCode, state: invalidState });
    
    // ASSERT: Erreur state invalide
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/auth/garmin/done?status=error');
    expect(response.headers.location).toContain('reason=invalid_state');
    
    // ASSERT: Code PAS marqué comme utilisé (car state invalide)
    expect(garminController.usedCodes.has(testCode)).toBe(false);
    
    // ASSERT: Aucun appel fetch
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('Échec échange token ne doit pas permettre retry avec même code', async () => {
    // ARRANGE: State valide
    const testState = 'test-state-fail';
    const testCode = 'failing-code';
    const testVerifier = 'fail-verifier';
    
    garminController.pendingAuths.set(testState, {
      verifier: testVerifier,
      correlationId: 'fail-correlation',
      createdAt: Date.now()
    });
    
    // Mock échec token (429 rate limit)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: () => Promise.resolve('Rate limit exceeded')
    });
    
    // ACT: Premier appel - échec token
    const response1 = await request(app)
      .get('/auth/garmin/rappel')
      .query({ code: testCode, state: testState });
    
    // Préparer nouveau state pour retry
    const retryState = 'retry-state';
    garminController.pendingAuths.set(retryState, {
      verifier: testVerifier,
      correlationId: 'retry-correlation',
      createdAt: Date.now()
    });
    
    // ACT: Tentative retry avec même code
    const response2 = await request(app)
      .get('/auth/garmin/rappel')
      .query({ code: testCode, state: retryState });
    
    // ASSERT: Premier appel rate_limited
    expect(response1.status).toBe(302);
    expect(response1.headers.location).toContain('/auth/garmin/done?status=rate_limited');
    
    // ASSERT: Retry rejeté comme duplicate
    expect(response2.status).toBe(302);
    expect(response2.headers.location).toContain('/auth/garmin/done?status=duplicate');
    
    // ASSERT: Un seul appel fetch (pas de retry)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

module.exports = {
  testSuite: 'Garmin OAuth Anti-Double Usage Protection'
};
