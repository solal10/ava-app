import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import ciqualData from '../../assets/ciqual.json';
import { addMeal } from '../../api/mealAPI';

export default function MealAnalyzer() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [ciqualMatches, setCiqualMatches] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mealType, setMealType] = useState('Déjeuner');
  const imageRef = useRef(null);

  // Charger le modèle MobileNet au montage du composant
  useEffect(() => {
    async function loadModel() {
      try {
        // Assurez-vous que TensorFlow.js est initialisé
        await tf.ready();
        // Charger le modèle MobileNet
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        console.log('Modèle MobileNet chargé avec succès');
      } catch (err) {
        console.error('Erreur lors du chargement du modèle:', err);
        setError('Impossible de charger le modèle d\'analyse. Veuillez réessayer.');
      }
    }
    
    loadModel();
    
    // Nettoyer les URL d'objets lors du démontage
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Réinitialiser les prédictions précédentes
      setPredictions([]);
      setError(null);
      
      // Mettre à jour l'image et l'aperçu
      setImage(file);
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setPreview(URL.createObjectURL(file));
    }
  };
  
  // Fonction pour normaliser une chaîne (supprimer accents, mettre en minuscule)
  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "");
  };

  // Trouver la correspondance la plus proche dans la base CIQUAL
  const findCiqualMatch = (label) => {
    const normalizedLabel = normalizeString(label);
    
    // Diviser le label en mots pour une recherche plus précise
    const labelWords = normalizedLabel.split(/\s+/);
    
    let bestMatch = null;
    let highestScore = 0;
    
    ciqualData.aliments.forEach(aliment => {
      let score = 0;
      
      // Vérifier le nom anglais
      const normalizedNomEn = normalizeString(aliment.nom_en);
      if (normalizedNomEn === normalizedLabel) {
        score += 10; // Correspondance exacte
      }
      
      // Vérifier les mots-clés
      aliment.keywords.forEach(keyword => {
        const normalizedKeyword = normalizeString(keyword);
        
        // Correspondance exacte avec un mot-clé
        if (normalizedKeyword === normalizedLabel) {
          score += 8;
        }
        
        // Correspondance partielle (le label contient le mot-clé ou vice versa)
        if (normalizedLabel.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedLabel)) {
          score += 5;
        }
        
        // Correspondance par mots
        labelWords.forEach(word => {
          if (word.length > 2 && normalizedKeyword.includes(word)) {
            score += 3;
          }
        });
      });
      
      // Si ce score est meilleur que le précédent, on garde cet aliment
      if (score > highestScore) {
        highestScore = score;
        bestMatch = aliment;
      }
    });
    
    // On considère qu'il faut un score minimum pour une correspondance valide
    return highestScore >= 3 ? bestMatch : null;
  };

  // Analyser l'image avec MobileNet
  const analyzeImage = async () => {
    if (!model || !imageRef.current) {
      setError('Le modèle n\'est pas encore chargé ou l\'image n\'est pas disponible.');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      setCiqualMatches([]);
      
      // Classifier l'image
      const predictions = await model.classify(imageRef.current);
      
      // Filtrer les prédictions pour ne garder que les aliments
      // et limiter à 3 résultats maximum
      const foodPredictions = predictions
        .map(prediction => ({
          className: prediction.className,
          probability: prediction.probability
        }))
        .slice(0, 3);
      
      setPredictions(foodPredictions);
      
      // Trouver les correspondances CIQUAL pour chaque prédiction
      const matches = foodPredictions.map(prediction => {
        const match = findCiqualMatch(prediction.className);
        return {
          prediction: prediction.className,
          probability: prediction.probability,
          match: match || null
        };
      });
      
      setCiqualMatches(matches);
    } catch (err) {
      console.error('Erreur lors de l\'analyse de l\'image:', err);
      setError('Impossible d\'analyser cette image. Veuillez réessayer avec une autre image.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Calculer les totaux nutritionnels
  const calculateNutritionTotals = () => {
    return ciqualMatches.reduce(
      (totals, item) => {
        if (item.match) {
          return {
            calories: totals.calories + item.match.calories,
            proteines: totals.proteines + item.match.proteines,
            glucides: totals.glucides + item.match.glucides,
            lipides: totals.lipides + item.match.lipides
          };
        }
        return totals;
      },
      { calories: 0, proteines: 0, glucides: 0, lipides: 0 }
    );
  };
  
  // Convertir l'image en base64
  const imageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };
  
  // Enregistrer le repas
  const handleSaveMeal = async () => {
    if (ciqualMatches.length === 0 || !ciqualMatches.some(item => item.match)) {
      setError('Aucun aliment reconnu à enregistrer.');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Récupérer l'ID utilisateur depuis localStorage
      const authData = localStorage.getItem('auth_data');
      let userId = 'default';
      
      if (authData) {
        try {
          const parsedData = JSON.parse(authData);
          userId = parsedData.userId || 'default';
        } catch (e) {
          console.error('Erreur lors de la récupération de l\'ID utilisateur:', e);
        }
      }
      
      // Préparer les données des aliments
      const aliments = ciqualMatches
        .filter(item => item.match)
        .map(item => ({
          nom: item.match.nom_fr,
          calories: item.match.calories,
          proteines: item.match.proteines,
          glucides: item.match.glucides,
          lipides: item.match.lipides
        }));
      
      // Calculer les totaux
      const totals = calculateNutritionTotals();
      
      // Convertir l'image en base64 si nécessaire
      let imageData = null;
      if (image) {
        try {
          imageData = await imageToBase64(image);
        } catch (e) {
          console.error('Erreur lors de la conversion de l\'image:', e);
        }
      }
      
      // Créer l'objet repas
      const meal = {
        userId,
        image: imageData,
        date: new Date().toISOString(),
        type: mealType,
        aliments,
        totalCalories: totals.calories,
        totalProteines: totals.proteines,
        totalGlucides: totals.glucides,
        totalLipides: totals.lipides
      };
      
      // Envoyer au backend
      await addMeal(userId, meal);
      
      // Afficher le message de succès
      setSuccess('Repas enregistré ! ✅');
      
      // Réinitialiser le formulaire
      setTimeout(() => {
        setImage(null);
        setPreview(null);
        setPredictions([]);
        setCiqualMatches([]);
        setMealType('Déjeuner');
      }, 2000);
      
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du repas:', err);
      setError(`Impossible d'enregistrer le repas: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">📷 Analyse de repas</h1>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="w-full text-sm border rounded p-2"
      />

      {preview && (
        <div className="mt-4">
          <img 
            ref={imageRef}
            src={preview} 
            alt="Aperçu du repas" 
            className="rounded shadow-md max-h-64 mx-auto" 
            crossOrigin="anonymous"
          />
        </div>
      )}

      {error && (
        <div className="card metric-poor border-2 mb-4">
          <p className="text-text-primary font-medium">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="card metric-excellent border-2 mb-4">
          <p className="text-text-primary font-medium">{success}</p>
        </div>
      )}

      <button
        onClick={analyzeImage}
        disabled={!image || isAnalyzing || !model}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all mb-6"
      >
        {isAnalyzing ? (
          <>
            <div className="loading-spinner w-4 h-4 inline-block mr-2"></div>
            Analyse en cours...
          </>
        ) : (
          <>Analyser 🍽️</>
        )}
      </button>

      {ciqualMatches.length > 0 && (
        <div className="mt-8 animate-slide-up">
          <h2 className="text-2xl font-semibold text-text-primary mb-6">📊 Résultats de l'analyse nutritionnelle</h2>
          
          <div className="mb-6">
            <label htmlFor="mealType" className="block text-sm font-medium text-text-primary mb-2">Type de repas</label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-background-accent focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-2xl bg-background-primary text-text-primary"
            >
              <option value="Petit-déjeuner">Petit-déjeuner</option>
              <option value="Déjeuner">Déjeuner</option>
              <option value="Dîner">Dîner</option>
              <option value="Collation">Collation</option>
            </select>
          </div>
          
          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-background-accent">
              <thead className="bg-background-accent">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-text-primary uppercase tracking-wider">Aliment détecté</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-text-primary uppercase tracking-wider">Correspondance</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-text-primary uppercase tracking-wider">Calories</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-text-primary uppercase tracking-wider">Protéines (g)</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-text-primary uppercase tracking-wider">Glucides (g)</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-text-primary uppercase tracking-wider">Lipides (g)</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-text-primary uppercase tracking-wider">Confiance</th>
                </tr>
              </thead>
              <tbody className="bg-background-primary divide-y divide-background-accent">
                {ciqualMatches.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.prediction}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.match ? item.match.nom_fr : (
                        <span className="text-red-500">Aliment non reconnu</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.match ? `${item.match.calories} kcal` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.match ? `${item.match.proteines} g` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.match ? `${item.match.glucides} g` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.match ? `${item.match.lipides} g` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {Math.round(item.probability * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
                
                {/* Ligne des totaux */}
                {ciqualMatches.some(item => item.match) && (
                  <tr className="bg-gray-100 font-medium">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan="2">TOTAL</td>
                    {(() => {
                      const totals = calculateNutritionTotals();
                      return (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{totals.calories} kcal</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{totals.proteines.toFixed(1)} g</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{totals.glucides.toFixed(1)} g</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{totals.lipides.toFixed(1)} g</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                        </>
                      );
                    })()} 
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSaveMeal}
              disabled={isSaving || !ciqualMatches.some(item => item.match)}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                <>Enregistrer ce repas 💾</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
