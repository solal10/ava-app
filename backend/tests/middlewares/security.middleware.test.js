const { securityMiddleware, authLimiter, generalLimiter, apiLimiter } = require('../../src/middlewares/security.middleware');

describe('Security Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      headers: {},
      ip: '192.168.1.1',
      method: 'GET',
      url: '/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('securityMiddleware', () => {
    it('devrait passer les requêtes normales', () => {
      req.body = { message: 'Hello World' };
      req.query = { page: '1' };
      
      securityMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('devrait bloquer les tentatives de SQL injection', () => {
      req.body = { query: "SELECT * FROM users WHERE id = 1; DROP TABLE users;" };
      
      securityMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Tentative d\'injection détectée')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait bloquer les tentatives de XSS', () => {
      req.body = { content: '<script>alert("xss")</script>' };
      
      securityMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Tentative d\'injection détectée')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait détecter les payloads trop volumineux', () => {
      const largeString = 'a'.repeat(2000000); // 2MB
      req.body = { data: largeString };
      
      securityMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Données trop volumineuses'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait détecter les requêtes suspectes fréquentes', () => {
      // Simuler plusieurs requêtes suspectes du même IP
      for (let i = 0; i < 12; i++) {
        req.body = { query: "UNION SELECT" };
        securityMiddleware(req, res, next);
      }
      
      // La 12ème requête devrait être bloquée pour fréquence excessive
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('devrait gérer les requêtes sans body', () => {
      req.body = undefined;
      req.query = undefined;
      
      securityMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Rate Limiters', () => {
    it('authLimiter devrait être défini', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });

    it('generalLimiter devrait être défini', () => {
      expect(generalLimiter).toBeDefined();
      expect(typeof generalLimiter).toBe('function');
    });

    it('apiLimiter devrait être défini', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
    });
  });

  describe('Pattern Detection', () => {
    const suspiciousPatterns = [
      "' OR '1'='1",
      "UNION SELECT",
      "<script>",
      "javascript:",
      "onload=",
      "../../../etc/passwd",
      "{{7*7}}",
      "${7*7}"
    ];

    suspiciousPatterns.forEach(pattern => {
      it(`devrait détecter le pattern suspect: ${pattern}`, () => {
        req.body = { input: pattern };
        
        securityMiddleware(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('IP Tracking', () => {
    it('devrait traquer les IPs suspectes', () => {
      const suspiciousReq = {
        ...req,
        body: { query: "' OR 1=1 --" },
        ip: '10.0.0.1'
      };
      
      // Première requête suspecte
      securityMiddleware(suspiciousReq, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      
      // Requête normale de la même IP
      suspiciousReq.body = { message: 'normal request' };
      jest.clearAllMocks();
      securityMiddleware(suspiciousReq, res, next);
      
      // Devrait toujours passer car c'est une requête normale
      expect(next).toHaveBeenCalled();
    });
  });
});