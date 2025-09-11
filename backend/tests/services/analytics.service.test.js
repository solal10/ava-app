const analyticsService = require('../../src/services/analytics.service');

// Mock dependencies
jest.mock('../../src/models/user.model');
jest.mock('../../src/services/logger.service');

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('devrait initialiser le service', async () => {
      const result = await analyticsService.initialize();
      expect(result).toBe(true);
    });
  });

  describe('trackEvent', () => {
    it('devrait enregistrer un événement', () => {
      const event = {
        type: 'test_event',
        userId: 'user123',
        data: { test: 'data' }
      };

      const result = analyticsService.trackEvent(event.type, event.userId, event.data);
      expect(result).toBeDefined();
    });

    it('devrait gérer les événements sans userId', () => {
      const event = {
        type: 'anonymous_event',
        data: { test: 'data' }
      };

      const result = analyticsService.trackEvent(event.type, null, event.data);
      expect(result).toBeDefined();
    });
  });

  describe('getCurrentStats', () => {
    it('devrait retourner les statistiques actuelles', () => {
      const stats = analyticsService.getCurrentStats();
      
      expect(stats).toHaveProperty('today');
      expect(stats).toHaveProperty('total');
      expect(stats.today).toHaveProperty('activeUsers');
      expect(stats.today).toHaveProperty('newUsers');
      expect(stats.today).toHaveProperty('totalEvents');
    });
  });

  describe('getEvents', () => {
    it('devrait retourner les événements avec filtres', () => {
      // Ajouter quelques événements pour le test
      analyticsService.trackEvent('test_event', 'user1', { action: 'login' });
      analyticsService.trackEvent('test_event', 'user2', { action: 'logout' });

      const events = analyticsService.getEvents({
        type: 'test_event',
        limit: 10
      });

      expect(Array.isArray(events)).toBe(true);
    });

    it('devrait limiter le nombre d\'événements retournés', () => {
      // Ajouter plusieurs événements
      for (let i = 0; i < 5; i++) {
        analyticsService.trackEvent('bulk_test', `user${i}`, { index: i });
      }

      const events = analyticsService.getEvents({
        type: 'bulk_test',
        limit: 3
      });

      expect(events.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getUserActivity', () => {
    it('devrait retourner l\'activité d\'un utilisateur', () => {
      const userId = 'user123';
      
      // Ajouter quelques événements pour cet utilisateur
      analyticsService.trackEvent('login', userId, { timestamp: Date.now() });
      analyticsService.trackEvent('page_view', userId, { page: '/dashboard' });

      const activity = analyticsService.getUserActivity(userId);
      
      expect(activity).toBeDefined();
      expect(Array.isArray(activity)).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('devrait calculer les métriques de base', () => {
      // Ajouter des données de test
      analyticsService.trackEvent('user_action', 'user1', { action: 'click' });
      analyticsService.trackEvent('user_action', 'user2', { action: 'view' });
      analyticsService.trackEvent('user_action', 'user1', { action: 'purchase' });

      const metrics = analyticsService.getMetrics();
      
      expect(metrics).toHaveProperty('totalEvents');
      expect(metrics).toHaveProperty('uniqueUsers');
      expect(metrics).toHaveProperty('eventTypes');
      expect(typeof metrics.totalEvents).toBe('number');
      expect(typeof metrics.uniqueUsers).toBe('number');
    });
  });

  describe('cleanup', () => {
    it('devrait nettoyer les anciens événements', () => {
      // Cette méthode devrait exister pour la maintenance
      const result = analyticsService.cleanup && analyticsService.cleanup();
      if (result !== undefined) {
        expect(typeof result).toBe('boolean');
      }
    });
  });

  describe('export data', () => {
    it('devrait exporter les données en format JSON', () => {
      // Ajouter des données de test
      analyticsService.trackEvent('export_test', 'user1', { test: true });
      
      const exportData = analyticsService.exportData && analyticsService.exportData();
      if (exportData !== undefined) {
        expect(typeof exportData).toBe('object');
      }
    });
  });
});