const axios = require('axios');
const sharp = require('sharp');
const FormData = require('form-data');
require('dotenv').config();

class FoodClassifier {
  constructor() {
    this.apiKey = process.env.CLARIFAI_API_KEY || 'demo_key_for_testing';
    this.baseURL = 'https://api.clarifai.com/v2';
    this.isServiceReady = true;
    
    console.log('✅ Service Clarifai configuré et prêt pour la reconnaissance alimentaire');
  }

  async checkServiceHealth() {
    try {
      if (!this.isServiceReady) {
        return {
          status: 'error',
          message: 'Clé API Spoonacular non configurée',
          serviceReady: false
        };
      }

      // Test de connectivité avec l'API Spoonacular
      const response = await axios.get(`${this.baseURL}/food/ingredients/search`, {
        params: {
          apiKey: this.apiKey,
          query: 'apple',
          number: 1
        },
        timeout: 5000
      });

      return {
        status: 'ok',
        message: 'Service de reconnaissance alimentaire opérationnel',
        serviceReady: true
      };
    } catch (error) {
      console.error('Erreur de connectivité API Spoonacular:', error.message);
      return {
        status: 'error',
        message: 'Service temporairement indisponible',
        serviceReady: false
      };
    }
  }

  /**
   * Analyse une image avec l'API Clarifai Food Recognition
   * @param {Buffer} imageBuffer - Buffer de l'image à analyser
   * @returns {Promise<Array>} - Liste des aliments détectés avec confiance
   */
  async analyzeImageWithClarifai(imageBuffer) {
    try {
      // Convertir l'image en base64
      const base64Image = imageBuffer.toString('base64');
      
      console.log('🔍 Analyse de l\'image avec Clarifai Food Model...');
      
      // Préparer la requête pour l'API Clarifai
      const requestBody = {
        inputs: [{
          data: {
            image: {
              base64: base64Image
            }
          }
        }]
      };
      
      // Appel à l'API Clarifai Food Model
      const response = await axios.post(
        `${this.baseURL}/models/food-item-recognition/outputs`,
        requestBody,
        {
          headers: {
            'Authorization': `Key ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (!response.data || !response.data.outputs || !response.data.outputs[0]) {
        throw new Error('Aucune réponse valide de l\'API Clarifai');
      }

      const output = response.data.outputs[0];
      if (!output.data || !output.data.concepts || output.data.concepts.length === 0) {
        throw new Error('Aucun aliment détecté dans cette image');
      }

      // Traiter les résultats de Clarifai (prendre les 3 meilleurs)
      const detectedFoods = output.data.concepts
        .slice(0, 3)
        .filter(concept => concept.value > 0.3) // Seuil de confiance minimum
        .map(concept => ({
          label: concept.name,
          confidence: Math.round(concept.value * 100),
          originalLabel: concept.name
        }));

      if (detectedFoods.length === 0) {
        throw new Error('Aucun aliment détecté avec suffisamment de confiance');
      }

      console.log(`✅ ${detectedFoods.length} aliment(s) détecté(s) avec Clarifai`);
      detectedFoods.forEach(food => {
        console.log(`   - ${food.label}: ${food.confidence}%`);
      });
      
      return detectedFoods;
      
    } catch (error) {
      console.error('Erreur API Clarifai:', error.message);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 429) {
          throw new Error('Quota API dépassé - veuillez réessayer plus tard');
        } else if (status === 401) {
          throw new Error('Clé API Clarifai invalide');
        } else if (status === 400) {
          throw new Error('Format de requête invalide');
        }
      }
      
      throw new Error(`Erreur lors de l'analyse: ${error.message}`);
    }
  }

  async preprocessImage(imageBuffer) {
    try {
      // Optimiser l'image pour l'API Spoonacular (max 1MB, format JPEG)
      const processedBuffer = await sharp(imageBuffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      return processedBuffer;
    } catch (error) {
      console.error('Erreur lors du préprocessing de l\'image:', error);
      throw new Error('Impossible de traiter l\'image');
    }
  }

  async classifyFood(imageBuffer) {
    try {
      console.log('🍽️ Début de l\'analyse alimentaire avec Spoonacular...');
      
      // Utiliser l'API Clarifai pour l'analyse
      const detectedFoods = await this.analyzeImageWithClarifai(imageBuffer);
      
      if (!detectedFoods || detectedFoods.length === 0) {
        throw new Error('Aucun aliment détecté dans cette image');
      }
      
      // Mapper les résultats vers des noms français
      const mappedPredictions = detectedFoods.map(food => ({
        label: this.mapLabelToFrench(food.label) || food.label,
        confidence: food.confidence,
        originalLabel: food.label,
        categoryId: food.categoryId
      }));
      
      const globalConfidence = Math.round(
        mappedPredictions.reduce((sum, pred) => sum + pred.confidence, 0) / mappedPredictions.length
      );
      
      console.log(`✅ Analyse terminée - ${mappedPredictions.length} aliment(s) détecté(s)`);
      
      return {
        predictions: mappedPredictions,
        globalConfidence: globalConfidence
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la classification:', error.message);
      throw error;
    }
  }

  mapLabelToFrench(englishLabel) {
    // Mapping des catégories Spoonacular vers le français
    const labelMap = {
      // Catégories principales Spoonacular
      'main course': 'Plat principal',
      'side dish': 'Accompagnement', 
      'dessert': 'Dessert',
      'appetizer': 'Entrée',
      'salad': 'Salade',
      'bread': 'Pain',
      'breakfast': 'Petit-déjeuner',
      'soup': 'Soupe',
      'beverage': 'Boisson',
      'sauce': 'Sauce',
      'marinade': 'Marinade',
      'fingerfood': 'Amuse-bouche',
      'snack': 'Collation',
      'drink': 'Boisson',
      
      // Aliments spécifiques
      'pizza': 'Pizza',
      'pasta': 'Pâtes',
      'burger': 'Hamburger',
      'sandwich': 'Sandwich',
      'chicken': 'Poulet',
      'beef': 'Bœuf',
      'pork': 'Porc',
      'fish': 'Poisson',
      'seafood': 'Fruits de mer',
      'vegetable': 'Légume',
      'fruit': 'Fruit',
      'rice': 'Riz',
      'noodles': 'Nouilles',
      'cake': 'Gâteau',
      'cookie': 'Biscuit',
      'ice cream': 'Glace',
      'chocolate': 'Chocolat',
      'chicken_curry': 'Curry de poulet',
      'chicken_quesadilla': 'Quesadilla au poulet',
      'chicken_wings': 'Ailes de poulet',
      'chocolate_cake': 'Gâteau au chocolat',
      'chocolate_mousse': 'Mousse au chocolat',
      'churros': 'Churros',
      'clam_chowder': 'Soupe de palourdes',
      'club_sandwich': 'Club sandwich',
      'crab_cakes': 'Galettes de crabe',
      'creme_brulee': 'Crème brûlée',
      'croque_madame': 'Croque-madame',
      'cup_cakes': 'Cupcakes',
      'deviled_eggs': 'Œufs à la diable',
      'donuts': 'Donuts',
      'dumplings': 'Raviolis',
      'edamame': 'Edamame',
      'eggs_benedict': 'Œufs Bénédicte',
      'escargots': 'Escargots',
      'falafel': 'Falafel',
      'filet_mignon': 'Filet mignon',
      'fish_and_chips': 'Fish and chips',
      'foie_gras': 'Foie gras',
      'french_fries': 'Frites',
      'french_onion_soup': 'Soupe à l\'oignon',
      'french_toast': 'Pain perdu',
      'fried_calamari': 'Calamars frits',
      'fried_rice': 'Riz sauté',
      'frozen_yogurt': 'Yaourt glacé',
      'garlic_bread': 'Pain à l\'ail',
      'gnocchi': 'Gnocchis',
      'greek_salad': 'Salade grecque',
      'grilled_cheese_sandwich': 'Croque-monsieur',
      'grilled_salmon': 'Saumon grillé',
      'guacamole': 'Guacamole',
      'gyoza': 'Gyoza',
      'hamburger': 'Hamburger',
      'hot_and_sour_soup': 'Soupe aigre-douce',
      'hot_dog': 'Hot-dog',
      'huevos_rancheros': 'Huevos rancheros',
      'hummus': 'Houmous',
      'ice_cream': 'Glace',
      'lasagna': 'Lasagnes',
      'lobster_bisque': 'Bisque de homard',
      'lobster_roll_sandwich': 'Sandwich au homard',
      'macaroni_and_cheese': 'Macaronis au fromage',
      'macarons': 'Macarons',
      'miso_soup': 'Soupe miso',
      'mussels': 'Moules',
      'nachos': 'Nachos',
      'omelette': 'Omelette',
      'onion_rings': 'Rondelles d\'oignon',
      'oysters': 'Huîtres',
      'pad_thai': 'Pad thaï',
      'paella': 'Paella',
      'pancakes': 'Pancakes',
      'panna_cotta': 'Panna cotta',
      'peking_duck': 'Canard laqué',
      'pho': 'Pho',
      'pizza': 'Pizza',
      'pork_chop': 'Côte de porc',
      'poutine': 'Poutine',
      'prime_rib': 'Côte de bœuf',
      'pulled_pork_sandwich': 'Sandwich porc effiloché',
      'ramen': 'Ramen',
      'ravioli': 'Raviolis',
      'red_velvet_cake': 'Red velvet cake',
      'risotto': 'Risotto',
      'samosa': 'Samosa',
      'sashimi': 'Sashimi',
      'scallops': 'Coquilles Saint-Jacques',
      'seaweed_salad': 'Salade d\'algues',
      'shrimp_and_grits': 'Crevettes et semoule',
      'spaghetti_bolognese': 'Spaghetti bolognaise',
      'spaghetti_carbonara': 'Spaghetti carbonara',
      'spring_rolls': 'Rouleaux de printemps',
      'steak': 'Steak',
      'strawberry_shortcake': 'Shortcake aux fraises',
      'sushi': 'Sushi',
      'tacos': 'Tacos',
      'takoyaki': 'Takoyaki',
      'tiramisu': 'Tiramisu',
      'tuna_tartare': 'Tartare de thon',
      'waffles': 'Gaufres'
    };
    
    return labelMap[englishLabel] || englishLabel.replace(/_/g, ' ');
  }
}

module.exports = new FoodClassifier();
