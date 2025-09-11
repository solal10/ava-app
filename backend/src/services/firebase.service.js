const admin = require('firebase-admin');
const User = require('../models/user.model');

class FirebaseService {
    constructor() {
        this.app = null;
        this.initialized = false;
        this.initializeFirebase();
    }

    initializeFirebase() {
        try {
            // Vérifier si toutes les variables Firebase sont configurées
            const requiredVars = [
                'FIREBASE_PROJECT_ID',
                'FIREBASE_PRIVATE_KEY',
                'FIREBASE_CLIENT_EMAIL'
            ];
            
            const missingVars = requiredVars.filter(varName => !process.env[varName]);
            
            if (missingVars.length > 0) {
                console.warn('⚠️ Configuration Firebase incomplète - Service désactivé');
                console.warn(`🔧 Variables manquantes: ${missingVars.join(', ')}`);
                this.initialized = false;
                return;
            }
            
            const serviceAccount = {
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: "https://accounts.google.com/o/oauth2/auth",
                token_uri: "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
            };

            // Vérifier si Firebase est déjà initialisé
            if (!admin.apps.length) {
                this.app = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
            } else {
                this.app = admin.app();
            }

            this.initialized = true;
            console.log('🔥 Firebase Admin SDK initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation Firebase:', error.message);
            this.initialized = false;
        }
    }

    /**
     * Envoie une notification push à un utilisateur spécifique
     */
    async sendNotificationToUser(userId, notification) {
        try {
            if (!this.initialized) {
                throw new Error('Firebase non initialisé');
            }

            const user = await User.findById(userId);
            if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
                throw new Error('Utilisateur sans token FCM');
            }

            const message = {
                data: {
                    type: notification.type || 'general',
                    userId: userId.toString(),
                    timestamp: new Date().toISOString(),
                    ...notification.data
                },
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.image
                },
                android: {
                    priority: 'high',
                    notification: {
                        icon: 'ic_notification',
                        color: '#3B82F6',
                        sound: 'default',
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                },
                tokens: user.fcmTokens
            };

            const response = await admin.messaging().sendMulticast(message);
            
            // Supprimer les tokens invalides
            if (response.failureCount > 0) {
                const invalidTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        invalidTokens.push(user.fcmTokens[idx]);
                    }
                });
                
                if (invalidTokens.length > 0) {
                    await this.removeInvalidTokens(userId, invalidTokens);
                }
            }

            console.log(`📱 Notification envoyée à ${user.prenom}: ${response.successCount}/${user.fcmTokens.length} succès`);
            return response;

        } catch (error) {
            console.error('❌ Erreur envoi notification:', error);
            throw error;
        }
    }

    /**
     * Envoie une notification à plusieurs utilisateurs
     */
    async sendNotificationToUsers(userIds, notification) {
        const results = [];
        
        for (const userId of userIds) {
            try {
                const result = await this.sendNotificationToUser(userId, notification);
                results.push({ userId, success: true, result });
            } catch (error) {
                results.push({ userId, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Envoie une notification à un topic
     */
    async sendNotificationToTopic(topic, notification) {
        try {
            if (!this.initialized) {
                throw new Error('Firebase non initialisé');
            }

            const message = {
                data: {
                    type: notification.type || 'general',
                    timestamp: new Date().toISOString(),
                    ...notification.data
                },
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.image
                },
                android: {
                    priority: 'high',
                    notification: {
                        icon: 'ic_notification',
                        color: '#3B82F6',
                        sound: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                },
                topic: topic
            };

            const response = await admin.messaging().send(message);
            console.log(`📡 Notification topic "${topic}" envoyée:`, response);
            return response;

        } catch (error) {
            console.error('❌ Erreur envoi notification topic:', error);
            throw error;
        }
    }

    /**
     * Abonne un utilisateur à un topic
     */
    async subscribeToTopic(tokens, topic) {
        try {
            if (!this.initialized) {
                throw new Error('Firebase non initialisé');
            }

            const response = await admin.messaging().subscribeToTopic(tokens, topic);
            console.log(`✅ Abonnement topic "${topic}":`, response);
            return response;
        } catch (error) {
            console.error('❌ Erreur abonnement topic:', error);
            throw error;
        }
    }

    /**
     * Désabonne un utilisateur d'un topic
     */
    async unsubscribeFromTopic(tokens, topic) {
        try {
            if (!this.initialized) {
                throw new Error('Firebase non initialisé');
            }

            const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
            console.log(`🚫 Désabonnement topic "${topic}":`, response);
            return response;
        } catch (error) {
            console.error('❌ Erreur désabonnement topic:', error);
            throw error;
        }
    }

    /**
     * Enregistre un token FCM pour un utilisateur
     */
    async registerFCMToken(userId, token) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Initialiser fcmTokens si nécessaire
            if (!user.fcmTokens) {
                user.fcmTokens = [];
            }

            // Ajouter le token s'il n'existe pas déjà
            if (!user.fcmTokens.includes(token)) {
                user.fcmTokens.push(token);
                await user.save();
                console.log(`📱 Token FCM enregistré pour ${user.prenom}`);
            }

            return { success: true, tokenCount: user.fcmTokens.length };
        } catch (error) {
            console.error('❌ Erreur enregistrement token FCM:', error);
            throw error;
        }
    }

    /**
     * Supprime un token FCM pour un utilisateur
     */
    async unregisterFCMToken(userId, token) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            if (user.fcmTokens) {
                user.fcmTokens = user.fcmTokens.filter(t => t !== token);
                await user.save();
                console.log(`🗑️ Token FCM supprimé pour ${user.prenom}`);
            }

            return { success: true, tokenCount: user.fcmTokens?.length || 0 };
        } catch (error) {
            console.error('❌ Erreur suppression token FCM:', error);
            throw error;
        }
    }

    /**
     * Supprime les tokens invalides pour un utilisateur
     */
    async removeInvalidTokens(userId, invalidTokens) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.fcmTokens) return;

            user.fcmTokens = user.fcmTokens.filter(token => !invalidTokens.includes(token));
            await user.save();
            
            console.log(`🧹 ${invalidTokens.length} tokens invalides supprimés pour ${user.prenom}`);
        } catch (error) {
            console.error('❌ Erreur suppression tokens invalides:', error);
        }
    }

    /**
     * Envoie des notifications de rappel personnalisées
     */
    async sendHealthReminders() {
        try {
            const users = await User.find({ 
                fcmTokens: { $exists: true, $ne: [] },
                'notificationPreferences.health.enabled': true 
            });

            const notifications = [];
            const currentHour = new Date().getHours();

            for (const user of users) {
                const prefs = user.notificationPreferences?.health;
                if (!prefs?.enabled) continue;

                // Rappel hydratation (toutes les 2h de 8h à 20h)
                if (prefs.hydration && currentHour >= 8 && currentHour <= 20 && currentHour % 2 === 0) {
                    notifications.push({
                        userId: user._id,
                        notification: {
                            title: '💧 Rappel Hydratation',
                            body: `${user.prenom}, n'oubliez pas de boire de l'eau !`,
                            type: 'health_reminder',
                            data: { reminderType: 'hydration' }
                        }
                    });
                }

                // Rappel exercice (16h)
                if (prefs.workout && currentHour === 16) {
                    notifications.push({
                        userId: user._id,
                        notification: {
                            title: '🏃‍♂️ Temps d\'Activité',
                            body: `${user.prenom}, que diriez-vous d'un peu d'exercice ?`,
                            type: 'health_reminder',
                            data: { reminderType: 'workout' }
                        }
                    });
                }

                // Rappel sommeil (22h)
                if (prefs.sleep && currentHour === 22) {
                    notifications.push({
                        userId: user._id,
                        notification: {
                            title: '🌙 Préparation au Sommeil',
                            body: `${user.prenom}, il est temps de vous préparer pour la nuit !`,
                            type: 'health_reminder',
                            data: { reminderType: 'sleep' }
                        }
                    });
                }
            }

            // Envoyer toutes les notifications
            const results = [];
            for (const notif of notifications) {
                try {
                    const result = await this.sendNotificationToUser(notif.userId, notif.notification);
                    results.push({ ...notif, success: true, result });
                } catch (error) {
                    results.push({ ...notif, success: false, error: error.message });
                }
            }

            console.log(`📊 Rappels santé envoyés: ${results.filter(r => r.success).length}/${results.length}`);
            return results;

        } catch (error) {
            console.error('❌ Erreur envoi rappels santé:', error);
            throw error;
        }
    }

    /**
     * Obtient le statut du service Firebase
     */
    getServiceStatus() {
        return {
            initialized: this.initialized,
            projectId: process.env.FIREBASE_PROJECT_ID || 'Non configuré',
            hasCredentials: !!(process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new FirebaseService();