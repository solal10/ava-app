const Meal = require('../../models/meal.model');
const User = require('../../models/user.model');

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
