const { authMiddleware, adminMiddleware, requireSubscription, generateToken } = require('../../src/middlewares/auth.middleware');
const jwt = require('jsonwebtoken');

// Mock User model
jest.mock('../../src/models/user.model', () => ({
  findById: jest.fn()
}));

const User = require('../../src/models/user.model');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('devrait authentifier un utilisateur avec un token valide', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        subscriptionLevel: 'pro',
        role: 'user'
      };

      const token = generateToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;
      
      User.findById.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('user123');
      expect(req.user.email).toBe('test@example.com');
      expect(req.subscriptionLevel).toBe('pro');
      expect(next).toHaveBeenCalled();
    });

    it('devrait rejeter les requêtes sans token', async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token d\'authentification requis'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter les tokens invalides', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token invalide'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter les tokens expirés', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user123', exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET || 'test-secret'
      );
      req.headers.authorization = `Bearer ${expiredToken}`;

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token invalide'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter les utilisateurs inexistants', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com' };
      const token = generateToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;
      
      User.findById.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Utilisateur non trouvé'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com' };
      const token = generateToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;
      
      User.findById.mockRejectedValue(new Error('DB Error'));

      try {
        await authMiddleware(req, res, next);
      } catch (error) {
        // L'erreur est gérée par le middleware
      }

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erreur interne lors de l\'authentification'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait accepter les tokens avec le préfixe Bearer', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        subscriptionLevel: 'pro'
      };

      const token = generateToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;
      
      User.findById.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('adminMiddleware', () => {
    it('devrait autoriser les administrateurs', async () => {
      req.user = {
        userId: 'admin123',
        role: 'admin'
      };

      await adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('devrait autoriser les super administrateurs', async () => {
      req.user = {
        userId: 'superadmin123',
        role: 'super_admin'
      };

      await adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('devrait rejeter les utilisateurs non authentifiés', async () => {
      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentification requise'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter les utilisateurs normaux', async () => {
      req.user = {
        userId: 'user123',
        role: 'user'
      };

      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Privilèges administrateur requis'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs', async () => {
      req.user = {
        userId: 'user123',
        role: 'user'
      };

      // Forcer une erreur en mockant next
      next.mockImplementation(() => {
        throw new Error('Test error');
      });

      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireSubscription', () => {
    it('devrait autoriser les utilisateurs avec un niveau suffisant', () => {
      req.subscriptionLevel = 'pro';
      const middleware = requireSubscription('pro');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('devrait rejeter les utilisateurs avec un niveau insuffisant', () => {
      req.subscriptionLevel = 'explore';
      const middleware = requireSubscription('pro');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Abonnement Pro requis pour accéder à cette fonctionnalité'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait autoriser elite pour les fonctionnalités pro', () => {
      req.subscriptionLevel = 'elite';
      const middleware = requireSubscription('pro');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('devrait autoriser pro pour les fonctionnalités perform', () => {
      req.subscriptionLevel = 'pro';
      const middleware = requireSubscription('perform');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('devrait rejeter explore pour les fonctionnalités perform', () => {
      req.subscriptionLevel = 'explore';
      const middleware = requireSubscription('perform');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('devrait générer un token JWT valide', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        subscriptionLevel: 'pro'
      };

      const token = generateToken(user);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Vérifier que le token peut être décodé
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.subscriptionLevel).toBe('pro');
    });

    it('devrait inclure une date d\'expiration', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        subscriptionLevel: 'pro'
      };

      const token = generateToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('rate limiting', () => {
    const { rateLimit } = require('../../src/middlewares/auth.middleware');

    it('devrait créer un middleware de rate limiting', () => {
      const limiter = rateLimit(10, 60000); // 10 requêtes par minute
      expect(typeof limiter).toBe('function');
    });

    it('devrait autoriser les requêtes sous la limite', () => {
      const limiter = rateLimit(10, 60000);
      req.ip = '192.168.1.1';

      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('devrait bloquer les requêtes au-dessus de la limite', () => {
      const limiter = rateLimit(2, 60000); // Limite très basse pour le test
      req.ip = '192.168.1.2';

      // Première requête - OK
      limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Deuxième requête - OK
      jest.clearAllMocks();
      limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Troisième requête - Bloquée
      jest.clearAllMocks();
      limiter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('token validation edge cases', () => {
    it('devrait gérer les headers d\'autorisation malformés', async () => {
      req.headers.authorization = 'InvalidFormat token123';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait gérer les tokens vides', async () => {
      req.headers.authorization = 'Bearer ';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait gérer les headers d\'autorisation vides', async () => {
      req.headers.authorization = '';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});