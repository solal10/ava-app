// 📁 frontend/src/components/meal/FoodAnalyzer.jsx
import React, { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import foodDB from '../../assets/ciqual.json';
import { labelToCiqualMap } from '../../utils/labelMap';

// Fonction pour matcher les labels IA avec la base CIQUAL
function matchLabelToCiqual(className) {
  const ciqualName = labelToCiqualMap[className.toLowerCase()];
  if (!ciqualName) return null;
  return foodDB.find(item => item.alim_nom_fr.toLowerCase() === ciqualName.toLowerCase());
}

export default function FoodAnalyzer() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const analyze = async () => {
    setLoading(true);
    try {
      const imgElement = document.getElementById('meal-photo');
      const model = await mobilenet.load();
      const predictions = await model.classify(imgElement);
      
      // Utilise la nouvelle logique de mapping
      const matchedFoods = predictions.map(p => {
        const foodItem = matchLabelToCiqual(p.className);
        if (foodItem) {
          return {
            label: foodItem.alim_nom_fr,
            confiance: Math.round(p.probability * 100),
            nutriments: foodItem,
            originalLabel: p.className
          };
        }
        return null;
      }).filter(Boolean);

      if (matchedFoods.length > 0) {
        // Prend le meilleur match (plus haute confiance)
        const bestMatch = matchedFoods[0];
        setResult(bestMatch);
      } else {
        setResult({ 
          error: "Aucun aliment connu n'a été reconnu.",
          suggestions: predictions.slice(0, 3).map(p => p.className).join(', ')
        });
      }
    } catch (error) {
      setResult({ error: "Erreur lors de l'analyse: " + error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-2">Analyseur de Repas (IA Locale)</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />
      {image && (
        <div className="mb-4">
          <img id="meal-photo" src={image} alt="meal" className="w-full max-h-64 object-contain" />
          <button onClick={analyze} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">
            {loading ? 'Analyse en cours...' : 'Analyser le repas'}
          </button>
        </div>
      )}
      {result && !result.error && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">{result.label} ({result.confiance}% de confiance)</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>Calories : {result.nutriments.energie_kcal}</div>
            <div>Protéines : {result.nutriments.proteines_g}g</div>
            <div>Lipides : {result.nutriments.lipides_g}g</div>
            <div>Glucides : {result.nutriments.glucides_g}g</div>
          </div>
        </div>
      )}
      {result?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <div className="text-red-600 font-semibold mb-2">{result.error}</div>
          {result.suggestions && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Labels détectés :</span> {result.suggestions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
