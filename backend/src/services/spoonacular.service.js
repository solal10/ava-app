const axios = require('axios');

class SpoonacularService {
  constructor() {
    this.apiKey = process.env.SPOONACULAR_API_KEY;
    this.baseURL = 'https://api.spoonacular.com';
    this.rateLimitDelay = 1000; // 1 seconde entre les requêtes pour respecter les limites
    this.lastRequestTime = 0;
    
    if (!this.apiKey || this.apiKey === 'your_spoonacular_api_key_here') {
      console.warn('⚠️  SPOONACULAR_API_KEY manquante ou non configurée');
      console.warn('🔑 Obtenez une clé API sur: https://spoonacular.com/food-api');
      this.mockMode = true;
    } else {
      console.log('✅ Service Spoonacular initialisé avec API key');
      this.mockMode = false;
    }
  }

  // Rate limiting pour respecter les limites de l'API
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Analyser une image de nourriture
  async analyzeFood(imageBase64) {
    if (this.mockMode) {
      return this.getMockFoodAnalysis();
    }

    try {
      await this.waitForRateLimit();

      // Convertir base64 en Buffer
      const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      
      const formData = new FormData();
      formData.append('file', new Blob([imageBuffer]), 'food.jpg');
      
      const response = await axios.post(
        `${this.baseURL}/food/images/analyze`,
        formData,
        {
          params: {
            apiKey: this.apiKey
          },
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 10000
        }
      );

      return this.formatFoodAnalysis(response.data);

    } catch (error) {
      console.error('Erreur analyse Spoonacular:', error.response?.data || error.message);
      
      // En cas d'erreur, retourner des données mock
      return this.getMockFoodAnalysis();
    }
  }

  // Obtenir des informations nutritionnelles détaillées
  async getNutritionInfo(foodName, amount = 100, unit = 'grams') {
    if (this.mockMode) {
      return this.getMockNutritionInfo(foodName);
    }

    try {
      await this.waitForRateLimit();

      const response = await axios.get(
        `${this.baseURL}/food/ingredients/search`,
        {
          params: {
            apiKey: this.apiKey,
            query: foodName,
            number: 1,
            addInformation: true
          },
          timeout: 5000
        }
      );

      if (response.data.results.length === 0) {
        throw new Error('Aliment non trouvé');
      }

      const ingredient = response.data.results[0];
      
      // Obtenir les informations nutritionnelles détaillées
      const nutritionResponse = await axios.get(
        `${this.baseURL}/food/ingredients/${ingredient.id}/information`,
        {
          params: {
            apiKey: this.apiKey,
            amount: amount,
            unit: unit
          },
          timeout: 5000
        }
      );

      return this.formatNutritionInfo(nutritionResponse.data, amount);

    } catch (error) {
      console.error('Erreur nutrition Spoonacular:', error.response?.data || error.message);
      
      // En cas d'erreur, retourner des données mock
      return this.getMockNutritionInfo(foodName);
    }
  }

  // Rechercher des recettes
  async searchRecipes(query, options = {}) {
    if (this.mockMode) {
      return this.getMockRecipes(query);
    }

    try {
      await this.waitForRateLimit();

      const {
        number = 10,
        diet = null,
        intolerances = null,
        maxCalories = null,
        maxProtein = null,
        maxCarbs = null,
        maxFat = null
      } = options;

      const params = {
        apiKey: this.apiKey,
        query: query,
        number: number,
        addRecipeInformation: true,
        fillIngredients: true,
        addRecipeNutrition: true
      };

      // Ajouter les filtres optionnels
      if (diet) params.diet = diet;
      if (intolerances) params.intolerances = intolerances;
      if (maxCalories) params.maxCalories = maxCalories;
      if (maxProtein) params.maxProtein = maxProtein;
      if (maxCarbs) params.maxCarbs = maxCarbs;
      if (maxFat) params.maxFat = maxFat;

      const response = await axios.get(
        `${this.baseURL}/recipes/complexSearch`,
        {
          params: params,
          timeout: 10000
        }
      );

      return this.formatRecipes(response.data.results);

    } catch (error) {
      console.error('Erreur recherche recettes Spoonacular:', error.response?.data || error.message);
      
      // En cas d'erreur, retourner des données mock
      return this.getMockRecipes(query);
    }
  }

  // Obtenir des suggestions de repas
  async getMealPlanSuggestions(targetCalories = 2000, diet = null, exclude = null) {
    if (this.mockMode) {
      return this.getMockMealPlan(targetCalories);
    }

    try {
      await this.waitForRateLimit();

      const params = {
        apiKey: this.apiKey,
        timeFrame: 'day',
        targetCalories: targetCalories
      };

      if (diet) params.diet = diet;
      if (exclude) params.exclude = exclude;

      const response = await axios.get(
        `${this.baseURL}/mealplanner/generate`,
        {
          params: params,
          timeout: 10000
        }
      );

      return this.formatMealPlan(response.data);

    } catch (error) {
      console.error('Erreur plan de repas Spoonacular:', error.response?.data || error.message);
      
      // En cas d'erreur, retourner des données mock
      return this.getMockMealPlan(targetCalories);
    }
  }

  // Formatter l'analyse de nourriture
  formatFoodAnalysis(data) {
    return {
      category: data.category?.name || 'Aliment non identifié',
      probability: data.category?.probability || 0.5,
      recipes: (data.recipes || []).slice(0, 3).map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        calories: recipe.nutrition?.calories || null
      })),
      nutrition: data.nutrition || this.getDefaultNutrition()
    };
  }

  // Formatter les informations nutritionnelles
  formatNutritionInfo(data, amount) {
    const nutrition = data.nutrition?.nutrients || [];
    
    return {
      name: data.name,
      amount: amount,
      unit: data.unit || 'g',
      calories: this.findNutrient(nutrition, 'Calories')?.amount || 0,
      protein: this.findNutrient(nutrition, 'Protein')?.amount || 0,
      carbs: this.findNutrient(nutrition, 'Carbohydrates')?.amount || 0,
      fat: this.findNutrient(nutrition, 'Fat')?.amount || 0,
      fiber: this.findNutrient(nutrition, 'Fiber')?.amount || 0,
      sugar: this.findNutrient(nutrition, 'Sugar')?.amount || 0,
      sodium: this.findNutrient(nutrition, 'Sodium')?.amount || 0,
      image: data.image,
      category: data.categoryPath?.[0] || 'Autre'
    };
  }

  // Formatter les recettes
  formatRecipes(recipes) {
    return recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      calories: recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || null,
      protein: recipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || null,
      healthScore: recipe.healthScore,
      summary: recipe.summary?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      sourceUrl: recipe.sourceUrl
    }));
  }

  // Formatter le plan de repas
  formatMealPlan(data) {
    return {
      totalCalories: data.nutrients?.calories || 2000,
      totalProtein: data.nutrients?.protein || 100,
      totalCarbs: data.nutrients?.carbohydrates || 250,
      totalFat: data.nutrients?.fat || 67,
      meals: (data.meals || []).map(meal => ({
        id: meal.id,
        title: meal.title,
        readyInMinutes: meal.readyInMinutes,
        servings: meal.servings,
        sourceUrl: meal.sourceUrl,
        image: meal.image
      }))
    };
  }

  // Trouver un nutriment spécifique
  findNutrient(nutrients, name) {
    return nutrients.find(nutrient => 
      nutrient.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  // Données mock pour les tests et la démo
  getMockFoodAnalysis() {
    const mockFoods = [
      {
        category: 'Fruits',
        probability: 0.85,
        nutrition: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
        recipes: [
          { id: 1, title: 'Salade de fruits', image: 'fruit-salad.jpg', calories: 120 },
          { id: 2, title: 'Smoothie aux fruits', image: 'smoothie.jpg', calories: 180 }
        ]
      },
      {
        category: 'Légumes',
        probability: 0.78,
        nutrition: { calories: 25, protein: 1.2, carbs: 5, fat: 0.1 },
        recipes: [
          { id: 3, title: 'Ratatouille', image: 'ratatouille.jpg', calories: 85 },
          { id: 4, title: 'Salade verte', image: 'salad.jpg', calories: 45 }
        ]
      }
    ];
    
    return mockFoods[Math.floor(Math.random() * mockFoods.length)];
  }

  getMockNutritionInfo(foodName) {
    return {
      name: foodName,
      amount: 100,
      unit: 'g',
      calories: Math.floor(Math.random() * 300) + 50,
      protein: Math.floor(Math.random() * 25) + 2,
      carbs: Math.floor(Math.random() * 40) + 5,
      fat: Math.floor(Math.random() * 15) + 1,
      fiber: Math.floor(Math.random() * 8) + 1,
      sugar: Math.floor(Math.random() * 20) + 2,
      sodium: Math.floor(Math.random() * 500) + 10,
      image: 'mock-food.jpg',
      category: 'Aliment'
    };
  }

  getMockRecipes(query) {
    return [
      {
        id: 1,
        title: `Recette ${query} santé`,
        image: 'recipe1.jpg',
        readyInMinutes: 30,
        servings: 4,
        calories: 350,
        protein: 25,
        healthScore: 85,
        summary: `Une délicieuse recette avec ${query}, parfaite pour un repas équilibré...`,
        sourceUrl: 'https://example.com/recipe1'
      },
      {
        id: 2,
        title: `${query} grillé aux légumes`,
        image: 'recipe2.jpg',
        readyInMinutes: 25,
        servings: 2,
        calories: 280,
        protein: 20,
        healthScore: 92,
        summary: `Une version légère et savoureuse de ${query} avec des légumes de saison...`,
        sourceUrl: 'https://example.com/recipe2'
      }
    ];
  }

  getMockMealPlan(targetCalories) {
    return {
      totalCalories: targetCalories,
      totalProtein: Math.floor(targetCalories * 0.15 / 4),
      totalCarbs: Math.floor(targetCalories * 0.55 / 4),
      totalFat: Math.floor(targetCalories * 0.30 / 9),
      meals: [
        {
          id: 1,
          title: 'Petit-déjeuner équilibré',
          readyInMinutes: 10,
          servings: 1,
          sourceUrl: 'https://example.com/breakfast',
          image: 'breakfast.jpg'
        },
        {
          id: 2,
          title: 'Déjeuner protéiné',
          readyInMinutes: 35,
          servings: 1,
          sourceUrl: 'https://example.com/lunch',
          image: 'lunch.jpg'
        },
        {
          id: 3,
          title: 'Dîner léger',
          readyInMinutes: 45,
          servings: 1,
          sourceUrl: 'https://example.com/dinner',
          image: 'dinner.jpg'
        }
      ]
    };
  }

  getDefaultNutrition() {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }
}

module.exports = new SpoonacularService();