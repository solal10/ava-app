const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-only';

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, subscriptionLevel } = req.body;
    const prenom = firstName || req.body.prenom;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const user = new User({
      email,
      password,
      prenom,
      isPremium: subscriptionLevel !== 'explore',
      subscriptionLevel: subscriptionLevel || 'explore'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, subscriptionLevel: user.subscriptionLevel, isPremium: user.isPremium },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        isPremium: user.isPremium,
        subscriptionLevel: user.subscriptionLevel,
        stats: user.stats,
        goals: user.goals,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      { userId: user._id, subscriptionLevel: user.subscriptionLevel, isPremium: user.isPremium },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        isPremium: user.isPremium,
        subscriptionLevel: user.subscriptionLevel,
        stats: user.stats,
        goals: user.goals,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ 
      user: {
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        isPremium: user.isPremium,
        subscriptionLevel: user.subscriptionLevel,
        stats: user.stats,
        goals: user.goals,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Récupérer les repas récents de l'utilisateur
    const Meal = require('../../models/meal.model');
    const recentMeals = await Meal.find({ userId: id })
      .sort({ date: -1 })
      .limit(5);

    // Récupérer les données de santé récentes
    const Health = require('../../models/health.model');
    const recentHealth = await Health.find({ userId: id })
      .sort({ date: -1 })
      .limit(7);

    res.status(200).json({ 
      user: {
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        isPremium: user.isPremium,
        subscriptionLevel: user.subscriptionLevel,
        stats: user.stats,
        goals: user.goals,
        preferences: user.preferences,
        createdAt: user.createdAt
      },
      recentMeals,
      recentHealth
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données utilisateur', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier les autorisations (seul l'utilisateur lui-même ou un admin peut modifier)
    if (id !== req.userId) {
      return res.status(403).json({ message: 'Non autorisé à modifier cet utilisateur' });
    }

    // Mettre à jour les champs autorisés
    if (updates.prenom) user.prenom = updates.prenom;
    if (updates.isPremium !== undefined) user.isPremium = updates.isPremium;
    
    // Mise à jour des stats
    if (updates.stats) {
      if (updates.stats.sommeil !== undefined) user.stats.sommeil = updates.stats.sommeil;
      if (updates.stats.stress !== undefined) user.stats.stress = updates.stats.stress;
      if (updates.stats.hydratation !== undefined) user.stats.hydratation = updates.stats.hydratation;
      if (updates.stats.energie !== undefined) user.stats.energie = updates.stats.energie;
      if (updates.stats.activite !== undefined) user.stats.activite = updates.stats.activite;
    }

    // Mise à jour des objectifs
    if (updates.goals) {
      if (updates.goals.sommeil !== undefined) user.goals.sommeil = updates.goals.sommeil;
      if (updates.goals.stress !== undefined) user.goals.stress = updates.goals.stress;
      if (updates.goals.hydratation !== undefined) user.goals.hydratation = updates.goals.hydratation;
      if (updates.goals.energie !== undefined) user.goals.energie = updates.goals.energie;
      if (updates.goals.activite !== undefined) user.goals.activite = updates.goals.activite;
    }

    // Sauvegarder les modifications
    await user.save();

    res.status(200).json({ 
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: user._id,
        prenom: user.prenom,
        isPremium: user.isPremium,
        stats: user.stats,
        goals: user.goals
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur', error: error.message });
  }
};

exports.createTestUser = async (req, res) => {
  try {
    // Vérifier si un utilisateur de test existe déjà
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      return res.status(200).json({ 
        message: 'Utilisateur de test existe déjà',
        user: {
          id: existingUser._id,
          email: existingUser.email,
          prenom: existingUser.prenom,
          isPremium: existingUser.isPremium
        }
      });
    }

    // Créer un nouvel utilisateur de test
    const user = new User({
      email: 'test@example.com',
      password: 'password123', // Sera hashé automatiquement par le middleware pre-save
      prenom: 'Utilisateur Test',
      isPremium: true,
      subscriptionLevel: 'pro',
      stats: {
        sommeil: 70,
        stress: 50,
        hydratation: 60,
        energie: 65,
        activite: 50
      },
      goals: {
        sommeil: 80,
        stress: 30,
        hydratation: 80,
        energie: 80,
        activite: 70
      },
      preferences: {
        objectif: 'bien_etre',
        etatMental: 'motive',
        activiteRecente: 'course à pied'
      }
    });

    await user.save();

    res.status(201).json({ 
      message: 'Utilisateur de test créé avec succès',
      user: {
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur de test', error: error.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { objectif, etatMental, activiteRecente } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (objectif) user.preferences.objectif = objectif;
    if (etatMental) user.preferences.etatMental = etatMental;
    if (activiteRecente) user.preferences.activiteRecente = activiteRecente;

    await user.save();

    res.status(200).json({ 
      message: 'Préférences mises à jour avec succès',
      preferences: user.preferences 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des préférences', error: error.message });
  }
};

exports.testLogin = async (req, res) => {
  try {
    const { subscriptionLevel } = req.body;
    
    if (!['explore', 'perform', 'pro', 'elite'].includes(subscriptionLevel)) {
      return res.status(400).json({ message: 'Niveau d\'abonnement invalide' });
    }

    const isPremium = subscriptionLevel !== 'explore';

    const token = jwt.sign(
      { userId: 'test-user', subscriptionLevel, isPremium },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Connexion de test réussie',
      token,
      user: {
        id: 'test-user',
        email: 'test@example.com',
        prenom: 'Utilisateur Test',
        isPremium,
        subscriptionLevel,
        stats: {
          sommeil: 70,
          stress: 50,
          hydratation: 60,
          energie: 65,
          activite: 50
        },
        goals: {
          sommeil: 80,
          stress: 30,
          hydratation: 80,
          energie: 80,
          activite: 70
        },
        preferences: {
          objectif: 'bien_etre',
          etatMental: 'motive',
          activiteRecente: 'course à pied'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion de test', error: error.message });
  }
};
