const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const loggerService = require('./logger.service');

/**
 * Service de sauvegarde MongoDB pour AVA Coach Santé IA
 * Gère les sauvegardes automatiques, la rotation et la restauration
 */
class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/coach_sante_db';
    this.dbName = this.extractDbName(this.mongoUri);
    this.isRunning = false;
    this.scheduledJobs = new Map();
    
    // Configuration par défaut
    this.config = {
      daily: {
        enabled: process.env.BACKUP_DAILY_ENABLED !== 'false',
        time: process.env.BACKUP_DAILY_TIME || '02:00', // 2h du matin
        retention: parseInt(process.env.BACKUP_DAILY_RETENTION) || 7 // 7 jours
      },
      weekly: {
        enabled: process.env.BACKUP_WEEKLY_ENABLED !== 'false',
        time: process.env.BACKUP_WEEKLY_TIME || '03:00', // 3h du matin
        day: process.env.BACKUP_WEEKLY_DAY || 'sunday',
        retention: parseInt(process.env.BACKUP_WEEKLY_RETENTION) || 4 // 4 semaines
      },
      monthly: {
        enabled: process.env.BACKUP_MONTHLY_ENABLED !== 'false',
        time: process.env.BACKUP_MONTHLY_TIME || '04:00', // 4h du matin
        day: parseInt(process.env.BACKUP_MONTHLY_DAY) || 1, // 1er du mois
        retention: parseInt(process.env.BACKUP_MONTHLY_RETENTION) || 6 // 6 mois
      },
      compression: {
        enabled: process.env.BACKUP_COMPRESSION !== 'false',
        level: parseInt(process.env.BACKUP_COMPRESSION_LEVEL) || 6
      },
      encryption: {
        enabled: process.env.BACKUP_ENCRYPTION === 'true',
        key: process.env.BACKUP_ENCRYPTION_KEY
      },
      remote: {
        enabled: process.env.BACKUP_REMOTE_ENABLED === 'true',
        type: process.env.BACKUP_REMOTE_TYPE || 's3', // s3, ftp, sftp
        config: {
          bucket: process.env.BACKUP_S3_BUCKET,
          region: process.env.BACKUP_S3_REGION || 'eu-west-1',
          accessKeyId: process.env.BACKUP_S3_ACCESS_KEY,
          secretAccessKey: process.env.BACKUP_S3_SECRET_KEY
        }
      }
    };

    console.log('💾 BackupService initialisé');
  }

  /**
   * Extraire le nom de la base de données depuis l'URI MongoDB
   */
  extractDbName(uri) {
    try {
      const match = uri.match(/\/([^/?]+)(?:\?|$)/);
      return match ? match[1] : 'coach_sante_db';
    } catch (error) {
      return 'coach_sante_db';
    }
  }

  /**
   * Initialiser le service de backup
   */
  async initialize() {
    try {
      // Créer le dossier de backup
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Créer les sous-dossiers par type
      const subDirs = ['daily', 'weekly', 'monthly', 'manual'];
      for (const subDir of subDirs) {
        await fs.mkdir(path.join(this.backupDir, subDir), { recursive: true });
      }

      // Vérifier la disponibilité de mongodump
      await this.checkMongoDumpAvailable();
      
      // Programmer les sauvegardes automatiques
      this.scheduleBackups();
      
      this.isRunning = true;
      loggerService.info('Service backup initialisé', {
        backupDir: this.backupDir,
        dbName: this.dbName,
        scheduledJobs: this.scheduledJobs.size
      });

    } catch (error) {
      loggerService.error('Erreur initialisation backup service', error);
      throw error;
    }
  }

  /**
   * Vérifier si mongodump est disponible
   */
  async checkMongoDumpAvailable() {
    return new Promise((resolve, reject) => {
      exec('mongodump --version', (error, stdout) => {
        if (error) {
          loggerService.warn('mongodump non disponible, utilisation de la méthode alternative');
          resolve(false);
        } else {
          loggerService.info('mongodump disponible', { version: stdout.trim() });
          resolve(true);
        }
      });
    });
  }

  /**
   * Programmer les sauvegardes automatiques
   */
  scheduleBackups() {
    try {
      // Sauvegarde quotidienne
      if (this.config.daily.enabled) {
        const dailyCron = `0 ${this.config.daily.time.split(':')[1]} ${this.config.daily.time.split(':')[0]} * * *`;
        const dailyJob = cron.schedule(dailyCron, async () => {
          await this.createBackup('daily');
          await this.cleanupOldBackups('daily', this.config.daily.retention);
        }, { scheduled: false });
        
        this.scheduledJobs.set('daily', dailyJob);
        dailyJob.start();
        loggerService.info('Sauvegarde quotidienne programmée', { time: this.config.daily.time });
      }

      // Sauvegarde hebdomadaire
      if (this.config.weekly.enabled) {
        const dayOfWeek = this.getDayOfWeekNumber(this.config.weekly.day);
        const weeklyCron = `0 ${this.config.weekly.time.split(':')[1]} ${this.config.weekly.time.split(':')[0]} * * ${dayOfWeek}`;
        const weeklyJob = cron.schedule(weeklyCron, async () => {
          await this.createBackup('weekly');
          await this.cleanupOldBackups('weekly', this.config.weekly.retention);
        }, { scheduled: false });
        
        this.scheduledJobs.set('weekly', weeklyJob);
        weeklyJob.start();
        loggerService.info('Sauvegarde hebdomadaire programmée', { 
          time: this.config.weekly.time, 
          day: this.config.weekly.day 
        });
      }

      // Sauvegarde mensuelle
      if (this.config.monthly.enabled) {
        const monthlyCron = `0 ${this.config.monthly.time.split(':')[1]} ${this.config.monthly.time.split(':')[0]} ${this.config.monthly.day} * *`;
        const monthlyJob = cron.schedule(monthlyCron, async () => {
          await this.createBackup('monthly');
          await this.cleanupOldBackups('monthly', this.config.monthly.retention);
        }, { scheduled: false });
        
        this.scheduledJobs.set('monthly', monthlyJob);
        monthlyJob.start();
        loggerService.info('Sauvegarde mensuelle programmée', { 
          time: this.config.monthly.time, 
          day: this.config.monthly.day 
        });
      }

    } catch (error) {
      loggerService.error('Erreur programmation sauvegardes', error);
    }
  }

  /**
   * Convertir le nom du jour en numéro pour cron (0=dimanche, 1=lundi, etc.)
   */
  getDayOfWeekNumber(dayName) {
    const days = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    return days[dayName.toLowerCase()] || 0;
  }

  /**
   * Créer une sauvegarde
   */
  async createBackup(type = 'manual', options = {}) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${this.dbName}_${type}_${timestamp}`;
    const backupPath = path.join(this.backupDir, type, backupName);

    try {
      loggerService.info('Début de sauvegarde', { type, backupName });

      // Créer la sauvegarde avec mongodump
      await this.createMongoDump(backupPath, options);

      // Compresser si activé
      let finalPath = backupPath;
      if (this.config.compression.enabled) {
        finalPath = await this.compressBackup(backupPath);
        // Supprimer le dossier non compressé
        await fs.rmdir(backupPath, { recursive: true });
      }

      // Chiffrer si activé
      if (this.config.encryption.enabled && this.config.encryption.key) {
        finalPath = await this.encryptBackup(finalPath);
      }

      // Uploader vers le stockage distant si configuré
      if (this.config.remote.enabled) {
        await this.uploadToRemoteStorage(finalPath, type);
      }

      const duration = Date.now() - startTime;
      const stats = await fs.stat(finalPath);

      loggerService.info('Sauvegarde terminée avec succès', {
        type,
        backupName,
        duration: `${duration}ms`,
        size: this.formatBytes(stats.size),
        path: finalPath
      });

      return {
        success: true,
        backupName,
        path: finalPath,
        size: stats.size,
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      loggerService.error('Erreur lors de la sauvegarde', error, {
        type,
        backupName,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: error.message,
        backupName,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Créer un dump MongoDB
   */
  async createMongoDump(backupPath, options = {}) {
    return new Promise((resolve, reject) => {
      // Construire la commande mongodump
      let cmd = `mongodump --uri="${this.mongoUri}" --out="${backupPath}"`;

      // Ajouter des options spécifiques
      if (options.collections && options.collections.length > 0) {
        // Sauvegarder seulement certaines collections
        cmd += ` --collection="${options.collections.join(',')}"`;
      }

      if (options.query) {
        cmd += ` --query='${JSON.stringify(options.query)}'`;
      }

      if (options.excludeCollections && options.excludeCollections.length > 0) {
        options.excludeCollections.forEach(collection => {
          cmd += ` --excludeCollection="${collection}"`;
        });
      }

      loggerService.info('Exécution mongodump', { command: cmd.replace(this.mongoUri, '[URI_MASKED]') });

      exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Erreur mongodump: ${error.message}`));
          return;
        }

        if (stderr && !stderr.includes('done dumping')) {
          loggerService.warn('Warnings mongodump', { stderr });
        }

        resolve(stdout);
      });
    });
  }

  /**
   * Compresser une sauvegarde
   */
  async compressBackup(backupPath) {
    return new Promise((resolve, reject) => {
      const compressedPath = `${backupPath}.tar.gz`;
      const cmd = `tar -czf "${compressedPath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Erreur compression: ${error.message}`));
          return;
        }

        loggerService.info('Sauvegarde compressée', { 
          original: backupPath, 
          compressed: compressedPath 
        });

        resolve(compressedPath);
      });
    });
  }

  /**
   * Chiffrer une sauvegarde (placeholder - nécessite openssl)
   */
  async encryptBackup(backupPath) {
    // Pour l'instant, retourner le chemin original
    // En production, implémenter le chiffrement avec openssl
    loggerService.warn('Chiffrement des sauvegardes non implémenté');
    return backupPath;
  }

  /**
   * Uploader vers le stockage distant (placeholder)
   */
  async uploadToRemoteStorage(filePath, type) {
    // Pour l'instant, juste logger
    // En production, implémenter l'upload S3/FTP/etc.
    loggerService.info('Upload sauvegarde vers stockage distant', { 
      file: filePath, 
      type,
      storage: this.config.remote.type 
    });
  }

  /**
   * Nettoyer les anciennes sauvegardes
   */
  async cleanupOldBackups(type, retentionDays) {
    try {
      const backupTypeDir = path.join(this.backupDir, type);
      const files = await fs.readdir(backupTypeDir);
      
      if (files.length === 0) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let deletedCount = 0;
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(backupTypeDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          totalSize += stats.size;
          
          if (stats.isDirectory()) {
            await fs.rmdir(filePath, { recursive: true });
          } else {
            await fs.unlink(filePath);
          }
          
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        loggerService.info('Nettoyage sauvegardes anciennes', {
          type,
          deletedFiles: deletedCount,
          freedSpace: this.formatBytes(totalSize),
          retentionDays
        });
      }

    } catch (error) {
      loggerService.error('Erreur nettoyage sauvegardes', error, { type });
    }
  }

  /**
   * Restaurer une sauvegarde
   */
  async restoreBackup(backupPath, options = {}) {
    const startTime = Date.now();

    try {
      loggerService.info('Début de restauration', { backupPath });

      // Vérifier que le fichier existe
      await fs.access(backupPath);

      // Construire la commande mongorestore
      let cmd = `mongorestore --uri="${this.mongoUri}"`;

      if (options.drop) {
        cmd += ' --drop';
      }

      if (options.dryRun) {
        cmd += ' --dryRun';
      }

      // Si c'est un fichier compressé, décompresser d'abord
      let restorePath = backupPath;
      if (backupPath.endsWith('.tar.gz')) {
        restorePath = await this.decompressBackup(backupPath);
      }

      cmd += ` "${restorePath}"`;

      const result = await new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Erreur mongorestore: ${error.message}`));
            return;
          }
          resolve({ stdout, stderr });
        });
      });

      const duration = Date.now() - startTime;

      loggerService.info('Restauration terminée avec succès', {
        backupPath,
        duration: `${duration}ms`
      });

      return {
        success: true,
        duration,
        output: result.stdout
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      loggerService.error('Erreur lors de la restauration', error, {
        backupPath,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Décompresser une sauvegarde
   */
  async decompressBackup(compressedPath) {
    return new Promise((resolve, reject) => {
      const extractDir = compressedPath.replace('.tar.gz', '');
      const cmd = `tar -xzf "${compressedPath}" -C "${path.dirname(compressedPath)}"`;

      exec(cmd, (error) => {
        if (error) {
          reject(new Error(`Erreur décompression: ${error.message}`));
          return;
        }

        resolve(extractDir);
      });
    });
  }

  /**
   * Lister les sauvegardes disponibles
   */
  async listBackups(type = null) {
    try {
      const backups = {};

      const types = type ? [type] : ['daily', 'weekly', 'monthly', 'manual'];

      for (const backupType of types) {
        const typeDir = path.join(this.backupDir, backupType);
        
        try {
          const files = await fs.readdir(typeDir);
          backups[backupType] = [];

          for (const file of files) {
            const filePath = path.join(typeDir, file);
            const stats = await fs.stat(filePath);

            backups[backupType].push({
              name: file,
              path: filePath,
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size),
              created: stats.mtime.toISOString(),
              isCompressed: file.endsWith('.tar.gz'),
              isDirectory: stats.isDirectory()
            });
          }

          // Trier par date de création (plus récent en premier)
          backups[backupType].sort((a, b) => new Date(b.created) - new Date(a.created));

        } catch (error) {
          backups[backupType] = [];
        }
      }

      return backups;
    } catch (error) {
      loggerService.error('Erreur listage sauvegardes', error);
      return {};
    }
  }

  /**
   * Obtenir les statistiques des sauvegardes
   */
  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      const stats = {
        totalBackups: 0,
        totalSize: 0,
        byType: {},
        lastBackup: null,
        oldestBackup: null
      };

      let allBackups = [];

      Object.keys(backups).forEach(type => {
        const typeBackups = backups[type];
        const typeSize = typeBackups.reduce((sum, backup) => sum + backup.size, 0);

        stats.byType[type] = {
          count: typeBackups.length,
          size: typeSize,
          sizeFormatted: this.formatBytes(typeSize),
          latest: typeBackups[0]?.created || null
        };

        stats.totalBackups += typeBackups.length;
        stats.totalSize += typeSize;

        allBackups = allBackups.concat(typeBackups);
      });

      if (allBackups.length > 0) {
        allBackups.sort((a, b) => new Date(b.created) - new Date(a.created));
        stats.lastBackup = allBackups[0];
        stats.oldestBackup = allBackups[allBackups.length - 1];
      }

      stats.totalSizeFormatted = this.formatBytes(stats.totalSize);

      return stats;
    } catch (error) {
      loggerService.error('Erreur calcul statistiques sauvegardes', error);
      return null;
    }
  }

  /**
   * Tester la connexion MongoDB
   */
  async testConnection() {
    return new Promise((resolve) => {
      const cmd = `mongosh "${this.mongoUri}" --eval "db.runCommand({ping: 1})"`;
      
      exec(cmd, (error, stdout) => {
        if (error) {
          resolve({ success: false, error: error.message });
          return;
        }

        const success = stdout.includes('"ok" : 1') || stdout.includes('"ok": 1');
        resolve({ success, output: stdout });
      });
    });
  }

  /**
   * Formatter la taille en octets
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Supprimer un backup spécifique
   */
  async deleteBackup(backupId) {
    try {
      const backupDir = path.join(this.backupDir, 'daily');
      const files = await fs.readdir(backupDir).catch(() => []);
      
      const backupFile = files.find(file => file.includes(backupId));
      if (!backupFile) {
        return { success: false, error: 'Backup non trouvé' };
      }

      const filePath = path.join(backupDir, backupFile);
      await fs.unlink(filePath);

      loggerService.info('Backup supprimé', { backupId, filePath });
      return { success: true };
    } catch (error) {
      loggerService.error('Erreur suppression backup', { backupId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer l'historique des backups
   */
  async getBackupHistory(limit = 50) {
    try {
      const history = [];
      const backupTypes = ['daily', 'weekly', 'monthly'];

      for (const type of backupTypes) {
        const typeDir = path.join(this.backupDir, type);
        try {
          const files = await fs.readdir(typeDir);
          
          for (const file of files) {
            const filePath = path.join(typeDir, file);
            const stats = await fs.stat(filePath);
            
            history.push({
              id: file.replace(/\.(tar\.gz|gz|zip)$/, ''),
              filename: file,
              type,
              size: this.formatBytes(stats.size),
              sizeBytes: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              path: filePath
            });
          }
        } catch (error) {
          // Dossier n'existe pas encore
        }
      }

      // Trier par date de création (plus récent en premier)
      history.sort((a, b) => new Date(b.created) - new Date(a.created));

      return history.slice(0, limit);
    } catch (error) {
      loggerService.error('Erreur récupération historique backup', { error: error.message });
      throw error;
    }
  }

  /**
   * Télécharger un backup
   */
  async downloadBackup(backupId) {
    try {
      const history = await this.getBackupHistory();
      const backup = history.find(b => b.id === backupId);

      if (!backup) {
        return { success: false, error: 'Backup non trouvé' };
      }

      return {
        success: true,
        filePath: backup.path,
        filename: backup.filename,
        size: backup.sizeBytes
      };
    } catch (error) {
      loggerService.error('Erreur téléchargement backup', { backupId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload vers stockage distant
   */
  async uploadToStorage(filePath, filename) {
    try {
      if (!this.config.remote.enabled) {
        return { success: false, error: 'Stockage distant non activé' };
      }

      // Simulation d'upload - à implémenter selon le type de stockage
      const storageType = this.config.remote.type;
      
      switch (storageType) {
        case 's3':
          return await this.uploadToS3(filePath, filename);
        case 'ftp':
          return await this.uploadToFTP(filePath, filename);
        case 'sftp':
          return await this.uploadToSFTP(filePath, filename);
        default:
          return { success: false, error: 'Type de stockage non supporté' };
      }
    } catch (error) {
      loggerService.error('Erreur upload stockage distant', { 
        filePath, 
        filename, 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload vers S3 (exemple)
   */
  async uploadToS3(filePath, filename) {
    // Implémentation S3 AWS SDK
    return { success: true, url: `s3://${this.config.remote.config.bucket}/${filename}` };
  }

  /**
   * Upload vers FTP (exemple)
   */
  async uploadToFTP(filePath, filename) {
    // Implémentation FTP
    return { success: true, url: `ftp://${this.config.remote.config.host}/${filename}` };
  }

  /**
   * Upload vers SFTP (exemple)
   */
  async uploadToSFTP(filePath, filename) {
    // Implémentation SFTP
    return { success: true, url: `sftp://${this.config.remote.config.host}/${filename}` };
  }

  /**
   * Arrêter le service de backup
   */
  stop() {
    this.scheduledJobs.forEach((job, type) => {
      job.destroy();
      loggerService.info('Sauvegarde programmée arrêtée', { type });
    });

    this.scheduledJobs.clear();
    this.isRunning = false;

    loggerService.info('Service backup arrêté');
  }

  /**
   * Obtenir le statut du service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      backupDir: this.backupDir,
      dbName: this.dbName,
      config: {
        daily: this.config.daily,
        weekly: this.config.weekly,
        monthly: this.config.monthly,
        compression: this.config.compression.enabled,
        encryption: this.config.encryption.enabled,
        remote: this.config.remote.enabled
      }
    };
  }
}

// Instance singleton
module.exports = new BackupService();