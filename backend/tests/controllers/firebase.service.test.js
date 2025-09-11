const firebaseService = require('../../src/services/firebase.service');
const User = require('../../src/models/User.model');

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
    apps: [],
    initializeApp: jest.fn(() => ({
        name: 'mockApp'
    })),
    credential: {
        cert: jest.fn()
    },
    messaging: jest.fn(() => ({
        sendMulticast: jest.fn(),
        send: jest.fn(),
        subscribeToTopic: jest.fn(),
        unsubscribeFromTopic: jest.fn()
    }))
}));

// Mock User model
jest.mock('../../src/models/User.model');

describe('FirebaseService', () => {
    let mockUser;
    let mockMessaging;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Configuration du mock User
        mockUser = {
            _id: 'test-user-id',
            prenom: 'TestUser',
            fcmTokens: ['token1', 'token2'],
            topicSubscriptions: [],
            save: jest.fn()
        };
        
        User.findById = jest.fn().mockResolvedValue(mockUser);
        
        // Configuration du mock Firebase messaging
        const admin = require('firebase-admin');
        mockMessaging = {
            sendMulticast: jest.fn().mockResolvedValue({
                successCount: 2,
                failureCount: 0,
                responses: [
                    { success: true },
                    { success: true }
                ]
            }),
            send: jest.fn().mockResolvedValue('mock-message-id'),
            subscribeToTopic: jest.fn().mockResolvedValue({
                successCount: 2,
                failureCount: 0
            }),
            unsubscribeFromTopic: jest.fn().mockResolvedValue({
                successCount: 2,
                failureCount: 0
            })
        };
        admin.messaging.mockReturnValue(mockMessaging);
    });

    describe('sendNotificationToUser', () => {
        it('devrait envoyer une notification à un utilisateur avec succès', async () => {
            const userId = 'test-user-id';
            const notification = {
                title: 'Test Title',
                body: 'Test Body',
                type: 'test'
            };

            const result = await firebaseService.sendNotificationToUser(userId, notification);

            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(mockMessaging.sendMulticast).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('devrait gérer un utilisateur sans tokens FCM', async () => {
            User.findById.mockResolvedValue({
                ...mockUser,
                fcmTokens: []
            });

            await expect(
                firebaseService.sendNotificationToUser('test-user-id', {
                    title: 'Test',
                    body: 'Test'
                })
            ).rejects.toThrow('Utilisateur sans token FCM');
        });

        it('devrait gérer un utilisateur non trouvé', async () => {
            User.findById.mockResolvedValue(null);

            await expect(
                firebaseService.sendNotificationToUser('non-existent-user', {
                    title: 'Test',
                    body: 'Test'
                })
            ).rejects.toThrow('Utilisateur sans token FCM');
        });
    });

    describe('sendNotificationToUsers', () => {
        it('devrait envoyer des notifications à plusieurs utilisateurs', async () => {
            const userIds = ['user1', 'user2'];
            const notification = {
                title: 'Bulk Test',
                body: 'Bulk Test Body'
            };

            const results = await firebaseService.sendNotificationToUsers(userIds, notification);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
        });

        it('devrait gérer les échecs partiels lors de l\'envoi groupé', async () => {
            User.findById
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(null);

            const userIds = ['user1', 'user2'];
            const notification = {
                title: 'Bulk Test',
                body: 'Bulk Test Body'
            };

            const results = await firebaseService.sendNotificationToUsers(userIds, notification);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(false);
        });
    });

    describe('sendNotificationToTopic', () => {
        it('devrait envoyer une notification à un topic', async () => {
            const topic = 'health_tips';
            const notification = {
                title: 'Topic Test',
                body: 'Topic Test Body'
            };

            const result = await firebaseService.sendNotificationToTopic(topic, notification);

            expect(mockMessaging.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    topic: topic,
                    notification: expect.objectContaining({
                        title: notification.title,
                        body: notification.body
                    })
                })
            );
            expect(result).toBe('mock-message-id');
        });
    });

    describe('registerFCMToken', () => {
        it('devrait enregistrer un nouveau token FCM', async () => {
            const userId = 'test-user-id';
            const token = 'new-fcm-token';

            const result = await firebaseService.registerFCMToken(userId, token);

            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(mockUser.fcmTokens).toContain(token);
            expect(mockUser.save).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('ne devrait pas ajouter un token déjà existant', async () => {
            const userId = 'test-user-id';
            const existingToken = 'token1';
            const initialLength = mockUser.fcmTokens.length;

            const result = await firebaseService.registerFCMToken(userId, existingToken);

            expect(mockUser.fcmTokens).toHaveLength(initialLength);
            expect(result.success).toBe(true);
        });

        it('devrait gérer un utilisateur non trouvé', async () => {
            User.findById.mockResolvedValue(null);

            await expect(
                firebaseService.registerFCMToken('non-existent-user', 'token')
            ).rejects.toThrow('Utilisateur non trouvé');
        });
    });

    describe('unregisterFCMToken', () => {
        it('devrait supprimer un token FCM existant', async () => {
            const userId = 'test-user-id';
            const tokenToRemove = 'token1';

            const result = await firebaseService.unregisterFCMToken(userId, tokenToRemove);

            expect(mockUser.fcmTokens).not.toContain(tokenToRemove);
            expect(mockUser.save).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('devrait gérer la suppression d\'un token inexistant', async () => {
            const userId = 'test-user-id';
            const nonExistentToken = 'non-existent-token';

            const result = await firebaseService.unregisterFCMToken(userId, nonExistentToken);

            expect(result.success).toBe(true);
        });
    });

    describe('subscribeToTopic', () => {
        it('devrait abonner des tokens à un topic', async () => {
            const tokens = ['token1', 'token2'];
            const topic = 'health_tips';

            const result = await firebaseService.subscribeToTopic(tokens, topic);

            expect(mockMessaging.subscribeToTopic).toHaveBeenCalledWith(tokens, topic);
            expect(result).toEqual({
                successCount: 2,
                failureCount: 0
            });
        });
    });

    describe('unsubscribeFromTopic', () => {
        it('devrait désabonner des tokens d\'un topic', async () => {
            const tokens = ['token1', 'token2'];
            const topic = 'health_tips';

            const result = await firebaseService.unsubscribeFromTopic(tokens, topic);

            expect(mockMessaging.unsubscribeFromTopic).toHaveBeenCalledWith(tokens, topic);
            expect(result).toEqual({
                successCount: 2,
                failureCount: 0
            });
        });
    });

    describe('sendHealthReminders', () => {
        it('devrait envoyer des rappels santé basés sur l\'heure', async () => {
            // Mock de l'heure actuelle à 16h (rappel exercice)
            const originalDate = Date;
            const mockDate = new Date('2023-01-01T16:00:00Z');
            global.Date = jest.fn(() => mockDate);
            global.Date.prototype.getHours = jest.fn(() => 16);

            User.find = jest.fn().mockResolvedValue([
                {
                    ...mockUser,
                    notificationPreferences: {
                        health: {
                            enabled: true,
                            workout: true
                        }
                    }
                }
            ]);

            const results = await firebaseService.sendHealthReminders();

            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);

            // Restaurer Date
            global.Date = originalDate;
        });
    });

    describe('getServiceStatus', () => {
        it('devrait retourner le statut du service Firebase', () => {
            const status = firebaseService.getServiceStatus();

            expect(status).toHaveProperty('initialized');
            expect(status).toHaveProperty('projectId');
            expect(status).toHaveProperty('hasCredentials');
            expect(status).toHaveProperty('timestamp');
            expect(typeof status.initialized).toBe('boolean');
        });
    });

    describe('removeInvalidTokens', () => {
        it('devrait supprimer les tokens invalides d\'un utilisateur', async () => {
            const userId = 'test-user-id';
            const invalidTokens = ['token1'];

            await firebaseService.removeInvalidTokens(userId, invalidTokens);

            expect(mockUser.fcmTokens).not.toContain('token1');
            expect(mockUser.fcmTokens).toContain('token2');
            expect(mockUser.save).toHaveBeenCalled();
        });
    });
});