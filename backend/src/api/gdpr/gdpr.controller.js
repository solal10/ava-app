const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// Models
const User = require('../../models/user.model');
const Health = require('../../models/health.model');
const Meal = require('../../models/meal.model');
const GarminData = require('../../models/garmindata.model');

// Services
const analyticsService = require('../../services/analytics.service');
const sentryService = require('../../services/sentry.service');

/**
 * Export complet des données utilisateur (Art. 20 GDPR - Portabilité)
 */
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const exportDate = new Date().toISOString().split('T')[0];
    
    console.log(`🔍 Début export GDPR pour utilisateur ${userId}`);
    
    // 1. Récupérer toutes les données utilisateur
    const [user, healthData, meals, garminData] = await Promise.all([
      User.findById(userId).select('-password').lean(),
      Health.find({ userId }).lean(),
      Meal.find({ userId }).lean(),
      GarminData.find({ userId }).lean()
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // 2. Créer l'archive ZIP en mémoire
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];
    
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', (err) => {
      console.error('❌ Erreur création archive:', err);
      throw err;
    });

    // 3. Ajouter les données JSON
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        userId: user._id,
        format: 'GDPR Export - Article 20',
        version: '1.0'
      },
      personalData: {
        profile: user,
        healthMetrics: healthData,
        meals: meals,
        garminIntegration: garminData
      },
      metadata: {
        totalRecords: {
          health: healthData.length,
          meals: meals.length,
          garmin: garminData.length
        },
        dataRange: {
          accountCreated: user.createdAt,
          lastUpdate: user.updatedAt
        }
      },
      gdprInfo: {
        rightsInfo: {
          'Art. 15': 'Droit d\'accès - Vous avez le droit d\'obtenir une copie de vos données',
          'Art. 16': 'Droit de rectification - Vous pouvez corriger vos données via l\'application',
          'Art. 17': 'Droit à l\'effacement - Utilisez /api/gdpr/delete pour supprimer vos données',
          'Art. 18': 'Droit à la limitation - Contactez le support pour suspendre le traitement',
          'Art. 20': 'Droit à la portabilité - Cet export vous permet de transférer vos données',
          'Art. 21': 'Droit d\'opposition - Vous pouvez vous opposer au traitement via les paramètres'
        },
        dataController: {
          name: 'AVA Coach Santé IA',
          email: 'privacy@ava-coach.com',
          dpo: 'dpo@ava-coach.com'
        }
      }
    };

    // Ajouter le fichier principal
    archive.append(
      JSON.stringify(exportData, null, 2), 
      { name: 'ava-export-complete.json' }
    );

    // Ajouter des fichiers séparés par catégorie
    archive.append(
      JSON.stringify(user, null, 2), 
      { name: 'profile/user-profile.json' }
    );
    
    archive.append(
      JSON.stringify(healthData, null, 2), 
      { name: 'health/health-metrics.json' }
    );
    
    archive.append(
      JSON.stringify(meals, null, 2), 
      { name: 'nutrition/meals-history.json' }
    );

    if (garminData.length > 0) {
      archive.append(
        JSON.stringify(garminData, null, 2), 
        { name: 'integrations/garmin-data.json' }
      );
    }

    // Ajouter un fichier README
    const readmeContent = `# Export GDPR - AVA Coach Santé IA

## Information sur cet export

Cet export contient toutes vos données personnelles conformément à l'Article 20 du RGPD (Droit à la portabilité des données).

**Date d'export:** ${new Date().toLocaleString('fr-FR')}
**Utilisateur:** ${user.email}

## Structure des fichiers

- \`ava-export-complete.json\` - Toutes vos données dans un seul fichier
- \`profile/\` - Informations de profil utilisateur
- \`health/\` - Métriques de santé et bien-être  
- \`nutrition/\` - Historique des repas et analyses
- \`integrations/\` - Données des services tiers (Garmin, etc.)

## Vos droits GDPR

- **Art. 15** - Droit d'accès ✅ (Cet export)
- **Art. 16** - Droit de rectification (Modifiable dans l'app)
- **Art. 17** - Droit à l'effacement (API /gdpr/delete)
- **Art. 18** - Droit à la limitation (Contactez le support)
- **Art. 20** - Droit à la portabilité ✅ (Cet export)  
- **Art. 21** - Droit d'opposition (Paramètres de l'app)

## Contact

- **Email:** privacy@ava-coach.com
- **DPO:** dpo@ava-coach.com
- **Support:** support@ava-coach.com

Cet export est généré automatiquement et contient toutes les données que nous détenons sur vous au moment de la demande.
`;

    archive.append(readmeContent, { name: 'README.md' });

    // Finaliser l'archive
    await archive.finalize();
    
    // Attendre que tous les chunks soient collectés
    const buffer = Buffer.concat(chunks);

    // Tracker l'export pour analytics (méthode compatible)
    try {
      if (analyticsService && typeof analyticsService.trackFeature === 'function') {
        await analyticsService.trackFeature('gdpr_export', userId, {
          dataSize: buffer.length,
          recordCounts: {
            health: healthData.length,
            meals: meals.length,
            garmin: garminData.length
          }
        });
      }
    } catch (analyticsError) {
      console.warn('Analytics tracking failed:', analyticsError.message);
    }

    console.log(`✅ Export GDPR généré: ${buffer.length} bytes pour utilisateur ${userId}`);

    // Retourner l'archive
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="ava-data-export-${exportDate}.zip"`,
      'Content-Length': buffer.length
    });
    
    res.send(buffer);

  } catch (error) {
    console.error('❌ Erreur export GDPR:', error);
    sentryService.captureException(error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des données',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Suppression complète des données utilisateur (Art. 17 GDPR - Droit à l'oubli)
 */
exports.deleteUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { confirmText, reason, keepAnonymizedStats } = req.body;

    // Vérification du texte de confirmation
    if (confirmText !== 'SUPPRIMER DÉFINITIVEMENT') {
      return res.status(400).json({
        success: false,
        message: 'Texte de confirmation incorrect. Vous devez saisir exactement "SUPPRIMER DÉFINITIVEMENT"'
      });
    }

    console.log(`🗑️ Début suppression GDPR pour utilisateur ${userId}, raison: ${reason}`);

    // Compter les enregistrements avant suppression
    const [healthCount, mealsCount, garminCount] = await Promise.all([
      Health.countDocuments({ userId }),
      Meal.countDocuments({ userId }),
      GarminData.countDocuments({ userId })
    ]);

    // Suppression en cascade de toutes les données
    const deletionPromises = [
      Health.deleteMany({ userId }),
      Meal.deleteMany({ userId }),
      GarminData.deleteMany({ userId }),
      // Ajouter d'autres collections si nécessaire
      // Conversations.deleteMany({ userId }),
      // PaymentHistory.updateMany({ userId }, { userId: null, userEmail: 'deleted@privacy.gdpr' })
    ];

    await Promise.all(deletionPromises);

    // Statistiques anonymisées (si autorisé)
    if (keepAnonymizedStats) {
      if (analyticsService && typeof analyticsService.trackFeature === 'function') {
        await analyticsService.trackFeature('gdpr_deletion', null, {
        reason: reason,
        recordsDeleted: {
          health: healthCount,
          meals: mealsCount, 
          garmin: garminCount
        },
        isAnonymized: true
        });
      }
    }

    // Suppression finale du compte utilisateur
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const deletionReport = {
      deletedAt: new Date().toISOString(),
      recordsDeleted: {
        user: 1,
        health: healthCount,
        meals: mealsCount,
        garminData: garminCount
      },
      totalRecordsDeleted: 1 + healthCount + mealsCount + garminCount
    };

    console.log(`✅ Suppression GDPR terminée pour ${deletedUser.email}:`, deletionReport);

    res.json({
      success: true,
      message: 'Votre compte et toutes vos données ont été définitivement supprimés conformément à l\'Article 17 du RGPD',
      deletionReport
    });

  } catch (error) {
    console.error('❌ Erreur suppression GDPR:', error);
    sentryService.captureException(error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des données',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtenir l'état des consentements utilisateur
 */
exports.getConsents = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('gdprConsents').lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Consentements par défaut si non définis
    const defaultConsents = {
      essential: {
        authentication: true, // Obligatoire pour le service
        dataProcessing: true   // Obligatoire pour le service
      },
      analytics: {
        usage: false,
        performance: false
      },
      marketing: {
        emails: false,
        personalization: false
      },
      thirdParty: {
        garmin: false,
        spoonacular: false
      }
    };

    const consents = user.gdprConsents || defaultConsents;

    res.json({
      success: true,
      consents,
      lastUpdated: user.gdprConsentsUpdatedAt || user.createdAt,
      info: {
        essential: 'Consentements obligatoires pour le fonctionnement du service',
        analytics: 'Amélioration du service et statistiques d\'usage',
        marketing: 'Communications personnalisées et recommandations',
        thirdParty: 'Intégrations avec des services externes'
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération consentements:', error);
    sentryService.captureException(error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des consentements'
    });
  }
};

/**
 * Mettre à jour les consentements utilisateur
 */
exports.updateConsents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { consents } = req.body;

    // Validation: les consentements essentiels ne peuvent pas être refusés
    if (consents.essential && 
        (consents.essential.authentication === false || consents.essential.dataProcessing === false)) {
      return res.status(400).json({
        success: false,
        message: 'Les consentements essentiels sont obligatoires pour utiliser le service'
      });
    }

    const updateData = {
      gdprConsents: consents,
      gdprConsentsUpdatedAt: new Date()
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, select: 'gdprConsents gdprConsentsUpdatedAt' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Tracker les changements de consentement
    if (analyticsService && typeof analyticsService.trackFeature === 'function') {
      await analyticsService.trackFeature('gdpr_consent_update', userId, {
        consentChanges: consents,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Consentements GDPR mis à jour pour utilisateur ${userId}`);

    res.json({
      success: true,
      message: 'Consentements mis à jour avec succès',
      updatedConsents: updatedUser.gdprConsents,
      updatedAt: updatedUser.gdprConsentsUpdatedAt
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour consentements:', error);
    sentryService.captureException(error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des consentements'
    });
  }
};

/**
 * Obtenir les informations sur les traitements de données (Art. 13-14 GDPR)
 */
exports.getDataProcessing = async (req, res) => {
  try {
    const processing = [
      {
        purpose: 'Création et gestion du compte utilisateur',
        legalBasis: 'Exécution d\'un contrat (Art. 6.1.b RGPD)',
        dataTypes: ['Email', 'Nom d\'utilisateur', 'Mot de passe (chiffré)', 'Date de création'],
        retention: '2 ans après fermeture du compte',
        recipients: ['Personnel technique autorisé'],
        storage: 'Base de données MongoDB sécurisée'
      },
      {
        purpose: 'Suivi des métriques de santé et bien-être',
        legalBasis: 'Consentement (Art. 6.1.a RGPD) + Données de santé (Art. 9.2.a RGPD)',
        dataTypes: ['Sommeil', 'Stress', 'Hydratation', 'Énergie', 'Activité physique'],
        retention: '5 ans ou jusqu\'à suppression par l\'utilisateur',
        recipients: ['Personnel médical autorisé', 'Services d\'analyse anonymisée'],
        storage: 'Base de données chiffrée avec accès restreint'
      },
      {
        purpose: 'Analyse nutritionnelle et recommandations alimentaires',
        legalBasis: 'Consentement (Art. 6.1.a RGPD)',
        dataTypes: ['Photos de repas', 'Informations nutritionnelles', 'Préférences alimentaires'],
        retention: '3 ans ou jusqu\'à suppression par l\'utilisateur',
        recipients: ['IA d\'analyse alimentaire', 'API Spoonacular (tiers)'],
        storage: 'Images stockées de manière sécurisée, données nutritionnelles en base'
      },
      {
        purpose: 'Coaching IA personnalisé et historique des conversations',
        legalBasis: 'Consentement (Art. 6.1.a RGPD)',
        dataTypes: ['Messages de chat', 'Préférences de coaching', 'Historique des interactions'],
        retention: '1 an ou jusqu\'à suppression par l\'utilisateur',
        recipients: ['Services IA (OpenAI/Anthropic)', 'Personnel de support'],
        storage: 'Conversations chiffrées avec accès limité'
      },
      {
        purpose: 'Intégration avec dispositifs de santé (Garmin)',
        legalBasis: 'Consentement (Art. 6.1.a RGPD)',
        dataTypes: ['Données d\'activité', 'Fréquence cardiaque', 'Sommeil', 'Stress'],
        retention: '2 ans après déconnexion de l\'intégration',
        recipients: ['API Garmin (tiers)', 'Personnel technique'],
        storage: 'Synchronisation sécurisée via OAuth 2.0'
      },
      {
        purpose: 'Amélioration du service et analyses statistiques',
        legalBasis: 'Intérêt légitime (Art. 6.1.f RGPD)',
        dataTypes: ['Données d\'usage anonymisées', 'Métriques de performance', 'Erreurs techniques'],
        retention: '6 mois sous forme anonymisée',
        recipients: ['Équipe de développement', 'Services de monitoring (Sentry)'],
        storage: 'Logs anonymisés et métriques agrégées'
      }
    ];

    res.json({
      success: true,
      processing,
      dataController: {
        name: 'AVA Coach Santé IA',
        address: '123 Rue de la Santé, 75001 Paris, France',
        email: 'privacy@ava-coach.com',
        phone: '+33 1 23 45 67 89',
        dpo: {
          email: 'dpo@ava-coach.com',
          role: 'Délégué à la Protection des Données'
        }
      },
      rights: {
        'Art. 15': 'Droit d\'accès à vos données personnelles',
        'Art. 16': 'Droit de rectification des données inexactes',
        'Art. 17': 'Droit à l\'effacement (droit à l\'oubli)',
        'Art. 18': 'Droit à la limitation du traitement',
        'Art. 20': 'Droit à la portabilité des données',
        'Art. 21': 'Droit d\'opposition au traitement',
        'Art. 22': 'Droit de ne pas faire l\'objet de décisions automatisées'
      },
      contact: {
        exerciseRights: 'Contactez privacy@ava-coach.com pour exercer vos droits',
        complaint: 'En cas de litige, contactez la CNIL: www.cnil.fr'
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération traitements:', error);
    sentryService.captureException(error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations sur les traitements'
    });
  }
};