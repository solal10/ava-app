const emailService = require('../../services/email.service');
const User = require('../../models/User.model'); // Correction de casse
const GarminData = require('../../models/GarminData.model'); // Correction de casse

/**
 * Envoyer un email de test
 */
const sendTestEmail = async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email de test requis'
      });
    }

    const result = await emailService.testConfiguration(testEmail);
    
    res.json({
      success: result.success,
      message: result.success ? 'Email de test envoyé avec succès' : 'Échec envoi email de test',
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur test email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Envoyer email de bienvenue
 */
const sendWelcomeEmail = async (req, res) => {
  try {
    const { userEmail, userName } = req.body;
    
    if (!userEmail || !userName) {
      return res.status(400).json({
        success: false,
        error: 'Email et nom utilisateur requis'
      });
    }

    const result = await emailService.sendWelcomeEmail(userEmail, userName);
    
    res.json({
      success: result.success,
      message: result.success ? 'Email de bienvenue envoyé' : 'Échec envoi email de bienvenue',
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur email bienvenue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Calculer les données santé hebdomadaires pour un utilisateur
 */
const getWeeklyHealthData = async (userId, startDate, endDate) => {
  try {
    const garminData = await GarminData.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    if (garminData.length === 0) {
      return {
        avgSteps: 0,
        avgSleep: 0,
        healthScore: 0,
        achievements: [],
        recommendations: 'Connectez votre appareil pour recevoir des données personnalisées',
        progressPercent: 0
      };
    }

    // Calculer moyennes
    const totalSteps = garminData.reduce((sum, day) => sum + (day.steps || 0), 0);
    const totalSleep = garminData.reduce((sum, day) => sum + (day.sleep?.totalSleep || 0), 0);
    const totalScore = garminData.reduce((sum, day) => sum + (day.healthScore || 0), 0);

    const avgSteps = Math.round(totalSteps / garminData.length);
    const avgSleep = Math.round((totalSleep / garminData.length) * 10) / 10;
    const healthScore = Math.round(totalScore / garminData.length);

    // Générer accomplissements
    const achievements = [];
    if (avgSteps >= 10000) achievements.push('🎯 Objectif 10,000 pas atteint en moyenne');
    if (avgSleep >= 7) achievements.push('😴 Sommeil optimal (7h+ en moyenne)');
    if (healthScore >= 80) achievements.push('💪 Score de santé excellent (80+)');
    
    // Générer recommandations
    let recommendations = 'Continuez vos efforts ! ';
    if (avgSteps < 8000) recommendations += 'Essayez d\'augmenter votre activité quotidienne. ';
    if (avgSleep < 7) recommendations += 'Privilégiez 7-8h de sommeil par nuit. ';
    if (healthScore < 70) recommendations += 'Consultez vos métriques pour identifier les axes d\'amélioration.';

    // Calculer progression (basée sur l'évolution des 7 derniers jours vs 7 précédents)
    const progressPercent = Math.min(100, Math.max(0, healthScore));

    return {
      avgSteps,
      avgSleep,
      healthScore,
      achievements,
      recommendations,
      progressPercent
    };

  } catch (error) {
    console.error('❌ Erreur calcul données hebdomadaires:', error.message);
    return {
      avgSteps: 0,
      avgSleep: 0,
      healthScore: 0,
      achievements: [],
      recommendations: 'Erreur lors du calcul des données hebdomadaires',
      progressPercent: 0
    };
  }
};

/**
 * Envoyer rapport santé hebdomadaire
 */
const sendWeeklyHealthReport = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID requis'
      });
    }

    // Récupérer les données utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Calculer les données de la semaine dernière
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const weeklyData = await getWeeklyHealthData(userId, startDate, endDate);
    
    const result = await emailService.sendHealthReport(
      user.email,
      user.username || user.firstName || 'Utilisateur',
      {
        startDate: startDate.toLocaleDateString('fr-FR'),
        endDate: endDate.toLocaleDateString('fr-FR'),
        avgSteps: weeklyData.avgSteps,
        avgSleep: weeklyData.avgSleep,
        healthScore: weeklyData.healthScore,
        achievements: weeklyData.achievements,
        recommendations: weeklyData.recommendations,
        progressPercent: weeklyData.progressPercent
      }
    );
    
    res.json({
      success: result.success,
      message: result.success ? 'Rapport santé envoyé' : 'Échec envoi rapport santé',
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur rapport santé:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Envoyer confirmation de connexion Garmin
 */
const sendGarminConnectionEmail = async (req, res) => {
  try {
    const { userEmail, userName } = req.body;
    const userId = req.userId;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email utilisateur requis'
      });
    }

    const result = await emailService.sendGarminConnectionEmail(
      userEmail, 
      userName || 'Utilisateur'
    );
    
    // Optionnel: marquer dans la base que l'email de confirmation a été envoyé
    if (userId && result.success) {
      try {
        await User.findByIdAndUpdate(userId, {
          $set: {
            'notifications.garminConnectionEmailSent': new Date(),
            'notifications.garminConnected': true
          }
        });
      } catch (updateError) {
        console.warn('⚠️ Erreur mise à jour statut email Garmin:', updateError.message);
      }
    }
    
    res.json({
      success: result.success,
      message: result.success ? 'Email confirmation Garmin envoyé' : 'Échec envoi email Garmin',
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur email Garmin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Envoyer email d'accomplissement d'objectif
 */
const sendGoalAchievementEmail = async (req, res) => {
  try {
    const { userEmail, userName, goalData } = req.body;
    
    if (!userEmail || !goalData) {
      return res.status(400).json({
        success: false,
        error: 'Email utilisateur et données objectif requis'
      });
    }

    const result = await emailService.sendGoalAchievementEmail(
      userEmail, 
      userName || 'Utilisateur',
      goalData
    );
    
    res.json({
      success: result.success,
      message: result.success ? 'Email accomplissement envoyé' : 'Échec envoi email accomplissement',
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur email accomplissement:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Envoyer emails en lot (pour les campagnes)
 */
const sendBulkEmails = async (req, res) => {
  try {
    const { emails, template, subject, data } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste d\'emails requise'
      });
    }

    if (emails.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 emails par lot'
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const email of emails) {
      try {
        const result = await emailService.sendEmail({
          to: email,
          subject: subject || 'Notification AVA Coach Santé',
          template,
          data: data || {}
        });
        
        results.push({
          email,
          success: result.success,
          messageId: result.messageId
        });
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Pause entre envois pour éviter le spam
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (emailError) {
        results.push({
          email,
          success: false,
          error: emailError.message
        });
        errorCount++;
      }
    }
    
    res.json({
      success: successCount > 0,
      message: `${successCount} emails envoyés avec succès, ${errorCount} échecs`,
      data: {
        total: emails.length,
        successCount,
        errorCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ Erreur envoi en lot:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Obtenir le statut du service email
 */
const getEmailStatus = async (req, res) => {
  try {
    const status = emailService.getStatus ? emailService.getStatus() : { status: 'unknown' };
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Erreur statut email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Programmer l'envoi de rapports hebdomadaires pour tous les utilisateurs actifs
 */
const scheduleWeeklyReports = async (req, res) => {
  try {
    // Récupérer tous les utilisateurs actifs avec notifications activées
    const activeUsers = await User.find({
      isActive: { $ne: false },
      'notifications.emailEnabled': { $ne: false }
    }).select('_id email username firstName lastName');

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const user of activeUsers) {
      try {
        // Calculer données hebdomadaires pour cet utilisateur
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const weeklyData = await getWeeklyHealthData(user._id, startDate, endDate);
        
        // Envoyer le rapport seulement si l'utilisateur a des données
        if (weeklyData.avgSteps > 0 || weeklyData.avgSleep > 0) {
          const result = await emailService.sendHealthReport(
            user.email,
            user.username || user.firstName || 'Utilisateur',
            {
              startDate: startDate.toLocaleDateString('fr-FR'),
              endDate: endDate.toLocaleDateString('fr-FR'),
              ...weeklyData
            }
          );

          if (result.success) {
            successCount++;
            results.push({ userId: user._id, email: user.email, status: 'sent' });
          } else {
            errorCount++;
            results.push({ userId: user._id, email: user.email, status: 'failed', error: result.error });
          }
        } else {
          results.push({ userId: user._id, email: user.email, status: 'skipped', reason: 'no_data' });
        }

        // Pause entre envois
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (userError) {
        errorCount++;
        results.push({ userId: user._id, email: user.email, status: 'error', error: userError.message });
      }
    }

    res.json({
      success: true,
      message: `Rapports hebdomadaires programmés: ${successCount} envoyés, ${errorCount} échecs`,
      data: {
        totalUsers: activeUsers.length,
        successCount,
        errorCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ Erreur programmation rapports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  sendTestEmail,
  sendWelcomeEmail,
  sendWeeklyHealthReport,
  sendGarminConnectionEmail,
  sendGoalAchievementEmail,
  sendBulkEmails,
  getEmailStatus,
  scheduleWeeklyReports
};