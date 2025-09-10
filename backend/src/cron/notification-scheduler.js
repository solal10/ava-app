const cron = require('node-cron');
const firebaseService = require('../services/firebase.service');

class NotificationScheduler {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            console.log('📅 Scheduler de notifications déjà en cours');
            return;
        }

        console.log('🚀 Démarrage du scheduler de notifications...');

        // Rappels d'hydratation toutes les 2h de 8h à 20h
        this.scheduleJob('hydration-reminders', '0 8,10,12,14,16,18,20 * * *', async () => {
            console.log('💧 Envoi des rappels d\'hydratation');
            try {
                await firebaseService.sendHealthReminders();
            } catch (error) {
                console.error('❌ Erreur rappels hydratation:', error);
            }
        });

        // Rappels d'exercice à 16h tous les jours
        this.scheduleJob('workout-reminders', '0 16 * * *', async () => {
            console.log('🏃‍♂️ Envoi des rappels d\'exercice');
            try {
                await firebaseService.sendNotificationToTopic('workout_reminders', {
                    title: '🏃‍♂️ Temps d\'Activité !',
                    body: 'Il est temps de bouger ! Que diriez-vous d\'un peu d\'exercice ?',
                    type: 'health_reminder',
                    data: { reminderType: 'workout' }
                });
            } catch (error) {
                console.error('❌ Erreur rappels exercice:', error);
            }
        });

        // Rappels de sommeil à 22h
        this.scheduleJob('sleep-reminders', '0 22 * * *', async () => {
            console.log('🌙 Envoi des rappels de sommeil');
            try {
                await firebaseService.sendNotificationToTopic('health_tips', {
                    title: '🌙 Préparation au Sommeil',
                    body: 'Il est temps de vous préparer pour une bonne nuit de repos !',
                    type: 'health_reminder',
                    data: { reminderType: 'sleep' }
                });
            } catch (error) {
                console.error('❌ Erreur rappels sommeil:', error);
            }
        });

        // Conseils santé quotidiens à 9h
        this.scheduleJob('daily-tips', '0 9 * * *', async () => {
            console.log('💡 Envoi des conseils santé quotidiens');
            const tips = [
                {
                    title: '💡 Conseil Santé du Jour',
                    body: 'Commencez votre journée par 10 minutes de méditation pour réduire le stress.',
                    type: 'health_tip'
                },
                {
                    title: '🥗 Nutrition du Jour',
                    body: 'Incluez des légumes colorés dans chaque repas pour plus de vitamines.',
                    type: 'nutrition_tip'
                },
                {
                    title: '🏃‍♀️ Mouvement du Jour',
                    body: 'Prenez les escaliers au lieu de l\'ascenseur aujourd\'hui !',
                    type: 'activity_tip'
                },
                {
                    title: '😴 Sommeil du Jour',
                    body: 'Évitez les écrans 1h avant le coucher pour un meilleur sommeil.',
                    type: 'sleep_tip'
                }
            ];

            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            
            try {
                await firebaseService.sendNotificationToTopic('health_tips', {
                    ...randomTip,
                    data: { category: randomTip.type }
                });
            } catch (error) {
                console.error('❌ Erreur conseils quotidiens:', error);
            }
        });

        // Motivation hebdomadaire le lundi à 8h
        this.scheduleJob('weekly-motivation', '0 8 * * 1', async () => {
            console.log('🔥 Envoi de la motivation hebdomadaire');
            try {
                await firebaseService.sendNotificationToTopic('achievements', {
                    title: '🔥 Nouvelle Semaine, Nouveaux Objectifs !',
                    body: 'C\'est parti pour une semaine pleine d\'énergie et de réussites !',
                    type: 'motivation',
                    data: { category: 'weekly_motivation' }
                });
            } catch (error) {
                console.error('❌ Erreur motivation hebdomadaire:', error);
            }
        });

        // Rappel weekly recap le dimanche à 19h
        this.scheduleJob('weekly-recap', '0 19 * * 0', async () => {
            console.log('📊 Envoi du récapitulatif hebdomadaire');
            try {
                await firebaseService.sendNotificationToTopic('achievements', {
                    title: '📊 Votre Semaine en Résumé',
                    body: 'Découvrez vos progrès et préparez la semaine prochaine !',
                    type: 'recap',
                    data: { category: 'weekly_recap' }
                });
            } catch (error) {
                console.error('❌ Erreur récapitulatif hebdomadaire:', error);
            }
        });

        this.isRunning = true;
        console.log('✅ Scheduler de notifications démarré avec succès');
        console.log(`📝 ${this.jobs.size} tâches programmées:`);
        this.jobs.forEach((job, name) => {
            console.log(`   - ${name}`);
        });
    }

    scheduleJob(name, schedule, task) {
        if (this.jobs.has(name)) {
            console.log(`⚠️ Tâche "${name}" déjà programmée, remplacement...`);
            this.jobs.get(name).destroy();
        }

        const job = cron.schedule(schedule, task, {
            scheduled: true,
            timezone: 'Europe/Paris'
        });

        this.jobs.set(name, job);
        console.log(`✅ Tâche "${name}" programmée: ${schedule}`);
    }

    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Scheduler de notifications déjà arrêté');
            return;
        }

        console.log('🛑 Arrêt du scheduler de notifications...');
        
        this.jobs.forEach((job, name) => {
            job.destroy();
            console.log(`   - Tâche "${name}" arrêtée`);
        });

        this.jobs.clear();
        this.isRunning = false;
        console.log('✅ Scheduler de notifications arrêté');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            jobCount: this.jobs.size,
            jobs: Array.from(this.jobs.keys())
        };
    }

    // Méthodes pour envoyer des notifications spécifiques immédiatement
    async sendWelcomeNotification(userId, userName) {
        try {
            await firebaseService.sendNotificationToUser(userId, {
                title: `🎉 Bienvenue ${userName} !`,
                body: 'Commencez votre parcours santé avec AVA Coach. Nous sommes là pour vous accompagner !',
                type: 'welcome',
                data: { 
                    category: 'onboarding',
                    userName: userName
                }
            });
            console.log(`👋 Notification de bienvenue envoyée à ${userName}`);
        } catch (error) {
            console.error('❌ Erreur notification bienvenue:', error);
            throw error;
        }
    }

    async sendAchievementNotification(userId, achievement) {
        try {
            await firebaseService.sendNotificationToUser(userId, {
                title: '🏆 Nouveau Succès Débloqué !',
                body: `Félicitations ! Vous avez atteint: ${achievement.title}`,
                type: 'achievement',
                data: { 
                    category: 'achievement',
                    achievementId: achievement.id,
                    points: achievement.points
                }
            });
            console.log(`🏆 Notification de succès envoyée pour: ${achievement.title}`);
        } catch (error) {
            console.error('❌ Erreur notification succès:', error);
            throw error;
        }
    }

    async sendSubscriptionUpgrade(userId, newTier) {
        try {
            const tierNames = {
                perform: 'Perform',
                pro: 'Pro',
                elite: 'Elite'
            };

            await firebaseService.sendNotificationToUser(userId, {
                title: '⭐ Mise à niveau Premium !',
                body: `Bienvenue dans ${tierNames[newTier]} ! Découvrez vos nouvelles fonctionnalités.`,
                type: 'subscription',
                data: { 
                    category: 'subscription_upgrade',
                    newTier: newTier
                }
            });
            console.log(`⭐ Notification upgrade envoyée pour: ${newTier}`);
        } catch (error) {
            console.error('❌ Erreur notification upgrade:', error);
            throw error;
        }
    }

    async sendHealthAlert(userId, alertType, message) {
        try {
            const alertIcons = {
                low_activity: '🚨',
                high_stress: '😰',
                poor_sleep: '😴',
                dehydration: '💧'
            };

            await firebaseService.sendNotificationToUser(userId, {
                title: `${alertIcons[alertType] || '⚠️'} Alerte Santé`,
                body: message,
                type: 'health_alert',
                data: { 
                    category: 'health_alert',
                    alertType: alertType
                }
            });
            console.log(`⚠️ Alerte santé envoyée: ${alertType}`);
        } catch (error) {
            console.error('❌ Erreur alerte santé:', error);
            throw error;
        }
    }
}

module.exports = new NotificationScheduler();