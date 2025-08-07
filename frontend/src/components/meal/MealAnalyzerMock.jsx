// Nouveau composant React : src/components/meal/MealAnalyzerMock.jsx
import React, { useState, useEffect } from 'react';
import ciqualData from '../../data/ciqual_sample.json';

export default function MealAnalyzerMock() {
  const [selectedFood, setSelectedFood] = useState('');
  const [nutrients, setNutrients] = useState(null);

  useEffect(() => {
    if (!selectedFood) return;
    const result = ciqualData.find(item => item.alim_nom_fr.toLowerCase().includes(selectedFood.toLowerCase()));
    setNutrients(result || null);
  }, [selectedFood]);

  const handleFoodChange = (e) => {
    setSelectedFood(e.target.value);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">🍽️ Analyseur de Repas (Mock)</h2>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Choisissez un aliment détecté :</label>
        <select value={selectedFood} onChange={handleFoodChange} className="w-full p-2 border border-gray-300 rounded">
          <option value="">-- Sélectionnez un aliment --</option>
          {ciqualData.map((item, idx) => (
            <option key={idx} value={item.alim_nom_fr}>{item.alim_nom_fr}</option>
          ))}
        </select>
      </div>

      {nutrients ? (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold mb-2">{nutrients.alim_nom_fr}</h3>
          <ul className="grid grid-cols-2 gap-4 text-sm">
            <li>🔥 Énergie : <strong>{nutrients.energie_kcal} kcal</strong></li>
            <li>💪 Protéines : <strong>{nutrients.proteines_g} g</strong></li>
            <li>🧈 Lipides : <strong>{nutrients.lipides_g} g</strong></li>
            <li>🍞 Glucides : <strong>{nutrients.glucides_g} g</strong></li>
            <li>🌱 Fibres : <strong>{nutrients.fibres_g} g</strong></li>
            <li>🧪 Calcium : <strong>{nutrients.calcium_mg} mg</strong></li>
            <li>🧪 Fer : <strong>{nutrients.fer_mg} mg</strong></li>
            <li>🧪 Vitamine C : <strong>{nutrients.vitamine_c_mg} mg</strong></li>
          </ul>
        </div>
      ) : (
        selectedFood && (
          <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-yellow-800">Aucune donnée nutritionnelle trouvée pour "{selectedFood}"</p>
          </div>
        )
      )}

      {!selectedFood && (
        <div className="mt-6 p-4 bg-blue-100 border border-blue-400 rounded">
          <p className="text-blue-800">Sélectionnez un aliment pour voir ses informations nutritionnelles</p>
        </div>
      )}
    </div>
  );
}
