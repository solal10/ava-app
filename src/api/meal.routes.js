const express = require('express');
const multer = require('multer');
const foodClassifier = require('../services/foodClassifier');

const router = express.Router();

// Configuration multer pour gérer les uploads d'images
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont acceptés'), false);
    }
  }
});

/**
 * POST /api/meal/analyze
 * Analyse une image de repas et retourne les aliments détectés
 * 
 * Body (multipart/form-data):
 * - image: fichier image
 * 
 * OU Body (JSON):
 * - imageBase64: string base64 de l'image
 */
router.post('/analyze', async (req, res) => {
  try {
    let imageBuffer;

    // Gestion de l'upload via multipart/form-data
    if (req.file) {
      imageBuffer = req.file.buffer;
    }
    // Gestion de l'image en base64
    else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }
    else {
      return res.status(400).json({
        success: false,
        error: 'Aucune image fournie. Utilisez le champ "image" (multipart) ou "imageBase64" (JSON).'
      });
    }

    // Vérifier la taille de l'image
    if (imageBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Image vide ou corrompue'
      });
    }

    console.log(`Analyse d'une image de ${imageBuffer.length} bytes...`);

    // Analyser l'image avec le classificateur
    const result = await foodClassifier.classifyFood(imageBuffer);

    // Retourner les résultats
    res.json({
      success: true,
      data: {
        detectedFoods: result.predictions,
        globalConfidence: result.globalConfidence,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'image:', error);
    
    // Gestion des erreurs spécifiques
    if (error.message.includes('Aucun aliment détecté')) {
      return res.status(422).json({
        success: false,
        error: 'Aucun aliment reconnu dans cette image. Essayez avec une photo plus claire.',
        code: 'NO_FOOD_DETECTED'
      });
    }
    
    if (error.message.includes('Impossible de traiter l\'image')) {
      return res.status(400).json({
        success: false,
        error: 'Format d\'image non supporté ou image corrompue.',
        code: 'INVALID_IMAGE'
      });
    }

    // Erreur générique
    res.status(500).json({
      success: false,
      error: 'Erreur interne lors de l\'analyse de l\'image',
      code: 'ANALYSIS_ERROR'
    });
  }
});

/**
 * GET /api/meal/health
 * Vérification de l'état du service d'analyse
 */
router.get('/health', async (req, res) => {
  try {
    const isModelLoaded = foodClassifier.isModelLoaded;
    
    res.json({
      success: true,
      data: {
        service: 'Food Analysis API',
        status: 'running',
        modelLoaded: isModelLoaded,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du service'
    });
  }
});

/**
 * GET /api/meal/labels
 * Retourne la liste des labels alimentaires supportés
 */
router.get('/labels', (req, res) => {
  try {
    const labels = foodClassifier.foodLabels.map(label => ({
      key: label,
      name: foodClassifier.mapLabelToFrench(label)
    }));

    res.json({
      success: true,
      data: {
        labels,
        count: labels.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des labels'
    });
  }
});

module.exports = router;
