const Meal = require('../../models/meal.model');
const User = require('../../models/user.model');
<<<<<<< HEAD
const NutritionPlan = require('../../models/nutritionplan.model');
const WorkoutPlan = require('../../models/workoutplan.model');
=======
>>>>>>> 5592fc713bb370061e61278d69a4f336199f21d2
const spoonacularService = require('../../services/spoonacular.service');
const { foodRecognitionService } = require('../../services/food-recognition.service');

// Ajouter un nouveau repas
exports.addMeal = async (req, res) => {
  try {
    const { userId } = req.params;
    const mealData = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Créer un nouveau repas
    const meal = new Meal({
      userId,
      name: mealData.name,
      description: mealData.description,
      imageUrl: mealData.imageUrl,
      calories: mealData.calories,
      nutrients: mealData.nutrients,
      mealType: mealData.mealType,
      aiAnalysis: mealData.aiAnalysis
    });

    // Sauvegarder le repas
    await meal.save();

    res.status(201).json({ 
      message: 'Repas enregistré avec succès',
      meal
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du repas:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'ajout du repas', 
      error: error.message 
    });
  }
};

// Récupérer tous les repas d'un utilisateur
exports.getUserMeals = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 30, skip = 0, startDate, endDate, mealType } = req.query;

    // Construire le filtre de date si nécessaire
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Construire la requête
    const query = { userId };
    if (startDate || endDate) query.date = dateFilter;
    if (mealType) query.mealType = mealType;

    // Récupérer les repas
    const meals = await Meal.find(query)
      .sort({ date: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Compter le nombre total de repas
    const total = await Meal.countDocuments(query);

    res.status(200).json({
      meals,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des repas:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des repas', 
      error: error.message 
    });
  }
};

// Récupérer les repas récents d'un utilisateur
exports.getRecentMeals = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    // Calculer la date de début (aujourd'hui - nombre de jours)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Récupérer les repas récents
    const recentMeals = await Meal.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    res.status(200).json({ recentMeals });
  } catch (error) {
    console.error('Erreur lors de la récupération des repas récents:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des repas récents', 
      error: error.message 
    });
  }
};

// Analyser une image de nourriture avec TensorFlow.js et Spoonacular
exports.analyzeFoodImage = async (req, res) => {
  try {
    const { imageData, useAI = true, portionHint } = req.body;

    if (!imageData) {
      return res.status(400).json({ message: 'Image requise pour l\'analyse' });
    }

    let tfAnalysis = null;
    let spoonacularAnalysis = null;

    // Convertir l'image base64 en buffer
    const imageBuffer = Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

    // Analyser avec TensorFlow.js si demandé et disponible
    if (useAI && foodRecognitionService.isModelLoaded) {
      try {
        tfAnalysis = await foodRecognitionService.recognizeFood(imageBuffer, {
          topK: 5,
          portionHint,
          startTime: Date.now()
        });
        console.log('🧠 Analyse TensorFlow.js réussie');
      } catch (error) {
        console.warn('⚠️ Échec analyse TensorFlow.js, utilisation Spoonacular:', error.message);
      }
    }

    // Analyser avec Spoonacular en parallèle ou comme fallback
    try {
      spoonacularAnalysis = await spoonacularService.analyzeFood(imageData);
      console.log('🥄 Analyse Spoonacular réussie');
    } catch (error) {
      console.warn('⚠️ Échec analyse Spoonacular:', error.message);
    }

    // Combiner les résultats
    const combinedResult = {
      success: !!(tfAnalysis?.success || spoonacularAnalysis),
      tensorflow: tfAnalysis,
      spoonacular: spoonacularAnalysis,
      combined: null,
      confidence: 0,
      recommendation: null
    };

    // Si les deux analyses sont disponibles, les combiner intelligemment
    if (tfAnalysis?.success && spoonacularAnalysis) {
      combinedResult.combined = {
        primaryFood: tfAnalysis.results[0]?.label || spoonacularAnalysis.category,
        confidence: Math.max(tfAnalysis.confidence, spoonacularAnalysis.probability * 100),
        nutrition: tfAnalysis.results[0]?.nutrition || spoonacularAnalysis.nutrition,
        portion: tfAnalysis.results[0]?.portion,
        alternatives: [
          ...(tfAnalysis.results.slice(1, 3) || []),
          ...(spoonacularAnalysis.alternatives || [])
        ].slice(0, 3)
      };
      combinedResult.confidence = combinedResult.combined.confidence;
    } else if (tfAnalysis?.success) {
      // Utiliser uniquement TensorFlow.js
      combinedResult.combined = {
        primaryFood: tfAnalysis.results[0]?.label,
        confidence: tfAnalysis.confidence,
        nutrition: tfAnalysis.results[0]?.nutrition,
        portion: tfAnalysis.results[0]?.portion,
        alternatives: tfAnalysis.results.slice(1, 3)
      };
      combinedResult.confidence = tfAnalysis.confidence;
    } else if (spoonacularAnalysis) {
      // Utiliser uniquement Spoonacular
      combinedResult.combined = {
        primaryFood: spoonacularAnalysis.category,
        confidence: spoonacularAnalysis.probability * 100,
        nutrition: spoonacularAnalysis.nutrition,
        portion: { amount: 1, unit: 'portion', grams: 100, estimated: true },
        alternatives: spoonacularAnalysis.alternatives || []
      };
      combinedResult.confidence = combinedResult.combined.confidence;
    }

    // Ajouter une recommandation basée sur la confiance
    if (combinedResult.confidence >= 80) {
      combinedResult.recommendation = 'high_confidence';
    } else if (combinedResult.confidence >= 60) {
      combinedResult.recommendation = 'medium_confidence';
    } else if (combinedResult.confidence >= 40) {
      combinedResult.recommendation = 'low_confidence';
    } else {
      combinedResult.recommendation = 'manual_entry_suggested';
    }

    res.status(200).json({
      message: 'Analyse de l\'image réussie',
      analysis: combinedResult,
      processingTime: Date.now() - (tfAnalysis?.metadata?.startTime || Date.now()),
      methods: {
        tensorflow: !!tfAnalysis?.success,
        spoonacular: !!spoonacularAnalysis
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'image:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'analyse de l\'image',
      error: error.message
    });
  }
};

// Rechercher des informations nutritionnelles
exports.searchNutrition = async (req, res) => {
  try {
    const { foodName, amount = 100, unit = 'grams' } = req.query;

    if (!foodName) {
      return res.status(400).json({ message: 'Nom de l\'aliment requis' });
    }

    // Obtenir les informations nutritionnelles
    const nutritionInfo = await spoonacularService.getNutritionInfo(foodName, amount, unit);

    res.status(200).json({
      message: 'Informations nutritionnelles récupérées',
      nutrition: nutritionInfo
    });

  } catch (error) {
    console.error('Erreur lors de la recherche nutritionnelle:', error);
    res.status(500).json({
      message: 'Erreur lors de la recherche nutritionnelle',
      error: error.message
    });
  }
};

// Rechercher des recettes
exports.searchRecipes = async (req, res) => {
  try {
    const { 
      query, 
      number = 10, 
      diet, 
      intolerances, 
      maxCalories, 
      maxProtein, 
      maxCarbs, 
      maxFat 
    } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Terme de recherche requis' });
    }

    const options = {
      number: parseInt(number),
      diet,
      intolerances,
      maxCalories: maxCalories ? parseInt(maxCalories) : null,
      maxProtein: maxProtein ? parseInt(maxProtein) : null,
      maxCarbs: maxCarbs ? parseInt(maxCarbs) : null,
      maxFat: maxFat ? parseInt(maxFat) : null
    };

    // Rechercher les recettes
    const recipes = await spoonacularService.searchRecipes(query, options);

    res.status(200).json({
      message: 'Recettes trouvées',
      recipes: recipes,
      query: query,
      filters: options
    });

  } catch (error) {
    console.error('Erreur lors de la recherche de recettes:', error);
    res.status(500).json({
      message: 'Erreur lors de la recherche de recettes',
      error: error.message
    });
  }
};

// Générer un plan de repas
exports.generateMealPlan = async (req, res) => {
  try {
    const { targetCalories = 2000, diet, exclude } = req.query;

    // Générer le plan de repas
    const mealPlan = await spoonacularService.getMealPlanSuggestions(
      parseInt(targetCalories),
      diet,
      exclude
    );

    res.status(200).json({
      message: 'Plan de repas généré',
      mealPlan: mealPlan,
      targetCalories: parseInt(targetCalories),
      filters: { diet, exclude }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du plan de repas:', error);
    res.status(500).json({
      message: 'Erreur lors de la génération du plan de repas',
      error: error.message
    });
  }
};

// Ajouter un repas avec analyse automatique
exports.addMealWithAnalysis = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageData, mealName, mealType = 'autre' } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let analysis = null;
    let nutritionInfo = null;

    // Analyser l'image si fournie
    if (imageData) {
      analysis = await spoonacularService.analyzeFood(imageData);
    }

    // Obtenir les infos nutritionnelles si nom fourni
    if (mealName) {
      nutritionInfo = await spoonacularService.getNutritionInfo(mealName);
    }

    // Créer le repas avec les données analysées
    const meal = new Meal({
      userId,
      name: mealName || analysis?.category || 'Repas non identifié',
      imageUrl: imageData,
      calories: nutritionInfo?.calories || analysis?.nutrition?.calories || 0,
      nutrients: {
        protein: nutritionInfo?.protein || analysis?.nutrition?.protein || 0,
        carbs: nutritionInfo?.carbs || analysis?.nutrition?.carbs || 0,
        fat: nutritionInfo?.fat || analysis?.nutrition?.fat || 0,
        fiber: nutritionInfo?.fiber || 0,
        sugar: nutritionInfo?.sugar || 0,
        sodium: nutritionInfo?.sodium || 0
      },
      mealType: mealType,
      aiAnalysis: {
        spoonacular: analysis,
        nutrition: nutritionInfo,
        confidence: analysis?.probability || 0.5,
        analysedAt: new Date()
      }
    });

    await meal.save();

    res.status(201).json({
      message: 'Repas ajouté avec analyse',
      meal: meal,
      analysis: analysis,
      nutritionInfo: nutritionInfo
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du repas avec analyse:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'ajout du repas avec analyse',
      error: error.message
    });
  }
};

// Reconnaissance alimentaire avancée avec analyse nutritionnelle
exports.advancedFoodRecognition = async (req, res) => {
  try {
    const { imageData, portion, preferences = {} } = req.body;

    if (!imageData) {
      return res.status(400).json({ message: 'Image requise pour l\'analyse' });
    }

    const imageBuffer = Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

    // Reconnaissance avec TensorFlow.js
    const recognition = await foodRecognitionService.recognizeFood(imageBuffer, {
      topK: 10,
      portionHint: portion
    });

    if (!recognition.success) {
      return res.status(400).json({
        message: 'Impossible d\'identifier l\'aliment',
        recognition
      });
    }

    // Analyse nutritionnelle détaillée
    const nutritionalAnalysis = await foodRecognitionService.analyzeNutritionalValue(
      recognition, 
      portion
    );

    // Recommandations personnalisées basées sur les préférences
    const recommendations = {
      healthiness: nutritionalAnalysis.nutrition.calories < 300 ? 'healthy' : 
                  nutritionalAnalysis.nutrition.calories < 500 ? 'moderate' : 'high_calorie',
      fitsDiet: checkDietCompatibility(nutritionalAnalysis, preferences.diet),
      suggestions: generateHealthySuggestions(nutritionalAnalysis),
      warnings: generateWarnings(nutritionalAnalysis)
    };

    res.status(200).json({
      message: 'Reconnaissance avancée réussie',
      recognition,
      nutrition: nutritionalAnalysis,
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur reconnaissance avancée:', error);
    res.status(500).json({
      message: 'Erreur lors de la reconnaissance avancée',
      error: error.message
    });
  }
};

// Analyse en lot de plusieurs images
exports.batchFoodRecognition = async (req, res) => {
  try {
    const { images, portions = [] } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Liste d\'images requise' });
    }

    if (images.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 images par batch' });
    }

    // Convertir les images en buffers
    const imageBuffers = images.map(imageData => 
      Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64')
    );

    // Reconnaissance en lot
    const batchResult = await foodRecognitionService.batchRecognize(imageBuffers, {
      topK: 5
    });

    // Analyser les résultats nutritionnels
    const nutritionalAnalyses = [];
    for (let i = 0; i < batchResult.results.length; i++) {
      if (batchResult.results[i].success) {
        const portion = portions[i] || null;
        const analysis = await foodRecognitionService.analyzeNutritionalValue(
          batchResult.results[i], 
          portion
        );
        nutritionalAnalyses.push(analysis);
      } else {
        nutritionalAnalyses.push(null);
      }
    }

    // Calcul des totaux nutritionnels
    const totalNutrition = nutritionalAnalyses
      .filter(n => n !== null)
      .reduce((total, analysis) => ({
        calories: total.calories + (analysis.nutrition.calories || 0),
        protein: total.protein + (analysis.nutrition.protein || 0),
        carbs: total.carbs + (analysis.nutrition.carbs || 0),
        fat: total.fat + (analysis.nutrition.fat || 0),
        fiber: total.fiber + (analysis.nutrition.fiber || 0),
        sugar: total.sugar + (analysis.nutrition.sugar || 0),
        sodium: total.sodium + (analysis.nutrition.sodium || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });

    res.status(200).json({
      message: 'Reconnaissance en lot réussie',
      batchResult,
      nutritionalAnalyses,
      totalNutrition,
      mealSummary: {
        totalFoods: nutritionalAnalyses.filter(n => n !== null).length,
        averageConfidence: batchResult.results
          .filter(r => r.success)
          .reduce((sum, r) => sum + r.confidence, 0) / batchResult.successCount || 0
      }
    });

  } catch (error) {
    console.error('Erreur reconnaissance en lot:', error);
    res.status(500).json({
      message: 'Erreur lors de la reconnaissance en lot',
      error: error.message
    });
  }
};

// Obtenir des informations sur le modèle de reconnaissance
exports.getModelInfo = async (_, res) => {
  try {
    const modelInfo = foodRecognitionService.getModelInfo();
    const modelStats = foodRecognitionService.getModelStats();

    res.status(200).json({
      message: 'Informations du modèle récupérées',
      model: modelInfo,
      stats: modelStats,
      status: {
        initialized: foodRecognitionService.isModelLoaded,
        ready: modelInfo !== null
      },
      capabilities: {
        foodRecognition: true,
        nutritionAnalysis: true,
        batchProcessing: true,
        confidenceScoring: true,
        portionEstimation: true,
        enhancedRecognition: true,
        pretrainedModels: true
      }
    });

  } catch (error) {
    console.error('Erreur récupération info modèle:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des informations du modèle',
      error: error.message
    });
  }
};

// Reconnaissance alimentaire améliorée avec MobileNet
exports.enhancedFoodRecognition = async (req, res) => {
  try {
    const { subscriptionLevel } = req;
    
    // Fonctionnalité réservée aux abonnements Pro et Elite
    if (!['pro', 'elite'].includes(subscriptionLevel)) {
      return res.status(403).json({
        message: 'Reconnaissance améliorée réservée aux abonnements Pro et Elite',
        upgrade: true
      });
    }

    const { imageData, options = {} } = req.body;

    if (!imageData) {
      return res.status(400).json({ 
        message: 'Données d\'image requises pour la reconnaissance améliorée' 
      });
    }

    // Convertir l'image base64 en buffer
    const imageBuffer = Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

    // Utiliser la reconnaissance améliorée
    const recognition = await foodRecognitionService.enhancedRecognition(imageBuffer, {
      topK: options.topK || 5,
      threshold: options.threshold || 0.1,
      enhancedMode: true
    });

    res.status(200).json({
      message: 'Reconnaissance alimentaire améliorée terminée',
      recognition,
      subscription: { level: subscriptionLevel, feature: 'enhanced_recognition' }
    });

  } catch (error) {
    console.error('❌ Erreur reconnaissance améliorée:', error);
    res.status(500).json({
      message: 'Erreur lors de la reconnaissance alimentaire améliorée',
      error: error.message
    });
  }
};

// Télécharger et configurer un modèle pré-entraîné
exports.downloadPretrainedModel = async (req, res) => {
  try {
    const { subscriptionLevel } = req;
    
    // Fonctionnalité réservée aux utilisateurs Elite
    if (subscriptionLevel !== 'elite') {
      return res.status(403).json({
        message: 'Téléchargement de modèles réservé aux utilisateurs Elite',
        upgrade: true
      });
    }

    const { modelUrl, modelName } = req.body;

    if (!modelUrl) {
      return res.status(400).json({ 
        message: 'URL du modèle requise' 
      });
    }

    const result = await foodRecognitionService.downloadPretrainedModel(modelUrl, modelName);
    
    if (result.success) {
      res.status(200).json({
        message: `Modèle ${result.modelName} téléchargé et configuré avec succès`,
        result,
        subscription: { level: subscriptionLevel, feature: 'model_download' }
      });
    } else {
      res.status(400).json({
        message: 'Échec du téléchargement du modèle',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erreur téléchargement modèle:', error);
    res.status(500).json({
      message: 'Erreur lors du téléchargement du modèle',
      error: error.message
    });
  }
};

// Supprimer un repas
exports.deleteMeal = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le repas existe
    const meal = await Meal.findById(id);
    if (!meal) {
      return res.status(404).json({ message: 'Repas non trouvé' });
    }

    // Vérifier si l'utilisateur est autorisé à supprimer ce repas
    if (meal.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce repas' });
    }

    // Supprimer le repas
    await Meal.findByIdAndDelete(id);

    res.status(200).json({ message: 'Repas supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du repas:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression du repas', 
      error: error.message 
    });
  }
};

// Fonctions utilitaires pour les recommandations
function checkDietCompatibility(nutritionalAnalysis, diet) {
  if (!diet) return 'unknown';

  const nutrition = nutritionalAnalysis.nutrition;
  
  switch (diet.toLowerCase()) {
    case 'keto':
      return nutrition.carbs < 5 ? 'compatible' : 'incompatible';
    case 'low_carb':
      return nutrition.carbs < 20 ? 'compatible' : 'incompatible';
    case 'high_protein':
      return nutrition.protein > 15 ? 'compatible' : 'incompatible';
    case 'low_fat':
      return nutrition.fat < 10 ? 'compatible' : 'incompatible';
    default:
      return 'unknown';
  }
}

function generateHealthySuggestions(nutritionalAnalysis) {
  const suggestions = [];
  const nutrition = nutritionalAnalysis.nutrition;

  if (nutrition.fiber < 3) {
    suggestions.push('Ajouter des légumes ou des fruits pour plus de fibres');
  }
  if (nutrition.protein < 10) {
    suggestions.push('Considérer une source de protéines supplémentaire');
  }
  if (nutrition.sodium > 500) {
    suggestions.push('Attention au taux de sodium élevé');
  }
  if (nutrition.sugar > 15) {
    suggestions.push('Taux de sucre élevé, consommer avec modération');
  }

  return suggestions;
}

function generateWarnings(nutritionalAnalysis) {
  const warnings = [];
  const nutrition = nutritionalAnalysis.nutrition;

  if (nutrition.calories > 600) {
    warnings.push({ type: 'high_calorie', message: 'Repas très calorique' });
  }
  if (nutrition.sodium > 1000) {
    warnings.push({ type: 'high_sodium', message: 'Taux de sodium très élevé' });
  }
  if (nutrition.fat > 30) {
    warnings.push({ type: 'high_fat', message: 'Teneur en graisse élevée' });
  }
  if (nutrition.sugar > 25) {
    warnings.push({ type: 'high_sugar', message: 'Taux de sucre très élevé' });
  }

  return warnings;
}
<<<<<<< HEAD

// Créer un plan nutritionnel personnalisé
exports.createNutritionPlan = async (req, res) => {
  try {
    const { userId } = req;
    const { 
      goals, 
      dietaryRestrictions, 
      targetCalories, 
      duration,
      preferences 
    } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const nutritionPlan = new NutritionPlan({
      userId,
      name: `Plan nutritionnel personnalisé - ${new Date().toLocaleDateString()}`,
      goals,
      dietaryRestrictions: dietaryRestrictions || [],
      targetCalories,
      duration: duration || 30,
      preferences: preferences || {},
      createdAt: new Date(),
      status: 'active'
    });

    await nutritionPlan.save();

    res.status(201).json({
      message: 'Plan nutritionnel créé avec succès',
      nutritionPlan
    });
  } catch (error) {
    console.error('❌ Erreur création plan nutritionnel:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du plan nutritionnel',
      error: error.message
    });
  }
};

// Récupérer les plans nutritionnels de l'utilisateur
exports.getNutritionPlans = async (req, res) => {
  try {
    const { userId } = req;

    const plans = await NutritionPlan.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Plans nutritionnels récupérés avec succès',
      plans
    });
  } catch (error) {
    console.error('❌ Erreur récupération plans nutritionnels:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des plans nutritionnels',
      error: error.message
    });
  }
};

// Créer un plan d'entraînement personnalisé  
exports.createWorkoutPlan = async (req, res) => {
  try {
    const { userId } = req;
    const { 
      goals,
      fitnessLevel,
      availableDays,
      duration,
      preferences 
    } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const workoutPlan = new WorkoutPlan({
      userId,
      name: `Plan d'entraînement personnalisé - ${new Date().toLocaleDateString()}`,
      goals: goals || ['general_fitness'],
      fitnessLevel: fitnessLevel || 'beginner', 
      availableDays: availableDays || 3,
      duration: duration || 30,
      preferences: preferences || {},
      createdAt: new Date(),
      status: 'active'
    });

    await workoutPlan.save();

    res.status(201).json({
      message: 'Plan d\'entraînement créé avec succès',
      workoutPlan
    });
  } catch (error) {
    console.error('❌ Erreur création plan entraînement:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du plan d\'entraînement',
      error: error.message
    });
  }
};

// Récupérer les plans d'entraînement de l'utilisateur
exports.getWorkoutPlans = async (req, res) => {
  try {
    const { userId } = req;

    const plans = await WorkoutPlan.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Plans d\'entraînement récupérés avec succès',
      plans
    });
  } catch (error) {
    console.error('❌ Erreur récupération plans entraînement:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des plans d\'entraînement',
      error: error.message
    });
  }
};
=======
>>>>>>> 5592fc713bb370061e61278d69a4f336199f21d2
