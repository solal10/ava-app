import React, { useState } from 'react';

export default function MealAnalyzer() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };
    const usedFoods = new Set();
    
    for (let i = 0; i < numFoods; i++) {
      let selectedFood;
      
      if (i === 0 && fileBasedDetection) {
        selectedFood = fileBasedDetection;
      } else {
        // Sélectionner un aliment aléatoire non encore utilisé
        do {
          const randomIndex = Math.floor(Math.random() * foodItems.length);
          selectedFood = foodItems[randomIndex];
        } while (usedFoods.has(selectedFood));
      }
      
      usedFoods.add(selectedFood);
      
      // Générer un score de confiance (plus élevé pour le premier aliment)
      const baseConfidence = i === 0 ? 0.75 : 0.45;
      const confidence = Math.min(0.95, baseConfidence + Math.random() * 0.2);
      
      detectedFoods.push({
        foodKey: selectedFood,
        confidence: Math.round(confidence * 100),
        ...foodCaloriesData[selectedFood]
      });
    }
    
    // Trier par confiance décroissante
    detectedFoods.sort((a, b) => b.confidence - a.confidence);
    
    // Calculer la confiance globale (moyenne pondérée)
    const totalWeight = detectedFoods.reduce((sum, food) => sum + food.confidence, 0);
    const globalConf = totalWeight / detectedFoods.length;
    
    // Simuler parfois une échec complet (10% de chance)
    if (Math.random() < 0.1) {
      throw new Error('Aucun aliment reconnu avec suffisamment de confiance');
    }
    
    return { detectedFoods, globalConfidence: Math.round(globalConf) };
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setError(null);
      setDetectedFoods([]);
      setIsEditing(false);
      setGlobalConfidence(0);
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await simulateMultiLabelFoodRecognition(selectedImage);
      setDetectedFoods(result.detectedFoods);
      setGlobalConfidence(result.globalConfidence);
    } catch (err) {
      setError(err.message);
      setDetectedFoods([]);
      setGlobalConfidence(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculer les totaux nutritionnels
  const calculateNutritionalTotals = () => {
    if (detectedFoods.length === 0) return { calories: 0, proteins: 0, lipids: 0, carbs: 0 };
    
    return detectedFoods.reduce((totals, food) => ({
      calories: totals.calories + food.calories,
      proteins: totals.proteins + food.proteins,
      lipids: totals.lipids + food.lipids,
      carbs: totals.carbs + food.carbs
    }), { calories: 0, proteins: 0, lipids: 0, carbs: 0 });
  };

  // Supprimer un aliment détecté
  const removeDetectedFood = (index) => {
    const updatedFoods = detectedFoods.filter((_, i) => i !== index);
    setDetectedFoods(updatedFoods);
    
    // Recalculer la confiance globale
    if (updatedFoods.length > 0) {
      const totalWeight = updatedFoods.reduce((sum, food) => sum + food.confidence, 0);
      setGlobalConfidence(Math.round(totalWeight / updatedFoods.length));
    } else {
      setGlobalConfidence(0);
    }
  };

  // Ajouter un aliment manuellement
  const addManualFood = (foodKey) => {
    const foodData = foodCaloriesData[foodKey];
    if (foodData && !detectedFoods.some(f => f.foodKey === foodKey)) {
      const newFood = {
        foodKey,
        confidence: 95, // Confiance élevée pour les ajouts manuels
        ...foodData
      };
      
      const updatedFoods = [...detectedFoods, newFood];
      setDetectedFoods(updatedFoods);
      
      // Recalculer la confiance globale
      const totalWeight = updatedFoods.reduce((sum, food) => sum + food.confidence, 0);
      setGlobalConfidence(Math.round(totalWeight / updatedFoods.length));
    }
  };

  const addToJournal = async () => {
    if (detectedFoods.length === 0) return;
    
    const totals = calculateNutritionalTotals();
    const mealData = {
      foods: detectedFoods.map(food => ({
        name: food.name,
        calories: food.calories,
        proteins: food.proteins,
        lipids: food.lipids,
        carbs: food.carbs,
        confidence: food.confidence
      })),
      totals,
      globalConfidence,
      image: imagePreview
    };
    
    try {
      // Ajouter via l'API utilisateur
      await userAPI.addMeal(mealData);
      
      // Ajouter aussi à l'historique local
      const newMeal = {
        id: Date.now(),
        name: `Repas (${detectedFoods.length} aliment${detectedFoods.length > 1 ? 's' : ''})`,
        ...totals,
        foods: detectedFoods,
        globalConfidence,
        timestamp: new Date().toISOString(),
        image: imagePreview
      };
      
      const updatedHistory = [newMeal, ...mealHistory];
      saveMealHistory(updatedHistory);
      
      // Réinitialiser l'analyse
      setSelectedImage(null);
      setImagePreview(null);
      setDetectedFoods([]);
      setIsEditing(false);
      setGlobalConfidence(0);
      
      // Message de succès
      alert('Repas ajouté au journal avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du repas:', error);
      alert('Erreur lors de l\'ajout du repas. Veuillez réessayer.');
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('mealHistory');
    setMealHistory([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <Utensils className="text-green-600" />
          Analyseur de Repas
        </h1>
        <p className="text-gray-600">Prenez une photo de votre repas pour analyser ses valeurs nutritionnelles</p>
      </div>

      {/* Section Upload/Camera */}
      <div className="mb-8">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
          {imagePreview ? (
            <div className="space-y-4">
              <img 
                src={imagePreview} 
                alt="Aperçu" 
                className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
              />
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Upload size={20} />
                  Changer l'image
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      Analyser le repas
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Camera size={48} className="mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Sélectionnez une photo de votre repas
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Upload size={20} />
                  Choisir une image
                </button>
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Résultat de l'analyse */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {detectedFoods.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">
                {detectedFoods.length} aliment{detectedFoods.length > 1 ? 's' : ''} détecté{detectedFoods.length > 1 ? 's' : ''}
              </h2>
              <span className="text-sm text-gray-600">({globalConfidence}% confiance globale)</span>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Edit size={16} />
              {isEditing ? 'Terminer' : 'Éditer'}
            </button>
          </div>

          {/* Alerte si confiance faible */}
          {globalConfidence < 60 && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 font-medium flex items-center gap-2">
                <AlertTriangle size={20} />
                Confiance faible ({globalConfidence}%). Vérifiez et éditez les aliments détectés si nécessaire.
              </p>
            </div>
          )}
          
          {/* Liste des aliments détectés */}
          <div className="space-y-3 mb-6">
            {detectedFoods.map((food, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{food.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      food.confidence >= 80 ? 'bg-green-100 text-green-800' :
                      food.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {food.confidence}%
                    </span>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeDetectedFood(index)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{food.description}</p>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-orange-600">{food.calories}</div>
                    <div className="text-gray-500">cal</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-600">{food.proteins}g</div>
                    <div className="text-gray-500">prot</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-yellow-600">{food.lipids}g</div>
                    <div className="text-gray-500">lip</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{food.carbs}g</div>
                    <div className="text-gray-500">gluc</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ajout manuel d'aliments en mode édition */}
          {isEditing && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Ajouter un aliment manuellement :</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.keys(foodCaloriesData)
                  .filter(key => !detectedFoods.some(f => f.foodKey === key))
                  .map(foodKey => (
                    <button
                      key={foodKey}
                      onClick={() => addManualFood(foodKey)}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    >
                      {foodCaloriesData[foodKey].name}
                    </button>
                  ))
                }
              </div>
            </div>
          )}
          
          {/* Totaux nutritionnels */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Total nutritionnel :</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const totals = calculateNutritionalTotals();
                return (
                  <>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-orange-200">
                      <div className="text-2xl font-bold text-orange-600">{totals.calories}</div>
                      <div className="text-sm text-gray-600">Calories totales</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-red-200">
                      <div className="text-2xl font-bold text-red-600">{totals.proteins}g</div>
                      <div className="text-sm text-gray-600">Protéines totales</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{totals.lipids}g</div>
                      <div className="text-sm text-gray-600">Lipides totaux</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{totals.carbs}g</div>
                      <div className="text-sm text-gray-600">Glucides totaux</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <button
            onClick={addToJournal}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Ajouter au journal alimentaire
          </button>
        </div>
      )}

      {/* Historique des repas */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <History size={24} />
            Historique des repas ({mealHistory.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showHistory ? 'Masquer' : 'Afficher'}
            </button>
            {mealHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Vider
              </button>
            )}
          </div>
        </div>

        {showHistory && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {mealHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun repas enregistré pour le moment</p>
            ) : (
              mealHistory.map((meal) => (
                <div key={meal.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4 mb-3">
                    {meal.image && (
                      <img 
                        src={meal.image} 
                        alt={meal.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{meal.name}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(meal.timestamp).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {meal.globalConfidence && (
                        <p className="text-xs text-gray-500">
                          Confiance: {meal.globalConfidence}%
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{meal.calories} cal</div>
                      <div className="text-xs text-gray-500">
                        P: {meal.proteins}g | L: {meal.lipids}g | G: {meal.carbs}g
                      </div>
                    </div>
                  </div>
                  
                  {/* Afficher les aliments détaillés si disponibles */}
                  {meal.foods && meal.foods.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-gray-600 mb-2">Aliments détectés :</p>
                      <div className="flex flex-wrap gap-2">
                        {meal.foods.map((food, index) => (
                          <span 
                            key={index}
                            className="text-xs px-2 py-1 bg-white rounded-full border text-gray-700"
                          >
                            {food.name} ({food.confidence}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
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
          <img src={preview} alt="Aperçu du repas" className="rounded shadow-md max-h-64 mx-auto" />
        </div>
      )}

      <button
        disabled={!image}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Analyser 🍽️
      </button>
    </div>
  );
}
