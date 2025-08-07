import React, { useState, useEffect } from 'react';
import SectionCard, { MetricCard, StatCard } from '../layout/SectionCard';

// Composant MealCard modernisé
const MealCard = ({ meal, onAnalyze }) => {
  const getMacroColor = (macro) => {
    switch (macro) {
      case 'protein': return 'text-green-400';
      case 'carbs': return 'text-yellow-400';
      case 'fat': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getHealthScore = (score) => {
    if (score >= 80) return { color: 'text-green-400', label: 'Excellent' };
    if (score >= 60) return { color: 'text-yellow-400', label: 'Bon' };
    if (score >= 40) return { color: 'text-orange-400', label: 'Moyen' };
    return { color: 'text-red-400', label: 'À améliorer' };
  };

  const health = getHealthScore(meal.healthScore);

  return (
    <SectionCard
      title={meal.name}
      icon={<span className="text-2xl">{meal.emoji}</span>}
      color="cyan"
      headerAction={
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${health.color}`}>
            {health.label}
          </span>
          <div className={`w-2 h-2 rounded-full ${health.color.replace('text-', 'bg-')}`}></div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Calories et heure */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-slate-100">{meal.calories}</span>
            <span className="text-sm text-slate-400 ml-1">kcal</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-300">{meal.time}</div>
            <div className="text-xs text-slate-400">{meal.type}</div>
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center bg-slate-700/50 rounded-lg p-2">
            <div className={`text-lg font-bold ${getMacroColor('protein')}`}>
              {meal.macros.protein}g
            </div>
            <div className="text-xs text-slate-400">Protéines</div>
          </div>
          <div className="text-center bg-slate-700/50 rounded-lg p-2">
            <div className={`text-lg font-bold ${getMacroColor('carbs')}`}>
              {meal.macros.carbs}g
            </div>
            <div className="text-xs text-slate-400">Glucides</div>
          </div>
          <div className="text-center bg-slate-700/50 rounded-lg p-2">
            <div className={`text-lg font-bold ${getMacroColor('fat')}`}>
              {meal.macros.fat}g
            </div>
            <div className="text-xs text-slate-400">Lipides</div>
          </div>
        </div>

        {/* IA Analysis */}
        {meal.aiAnalysis && (
          <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-slate-900 font-bold text-xs">AI</span>
              </div>
              <p className="text-cyan-300 text-sm leading-relaxed">{meal.aiAnalysis}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            onClick={() => onAnalyze(meal.id)}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm py-2 rounded-lg transition-colors"
          >
            Analyser avec IA
          </button>
          <button className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2 rounded-lg transition-colors">
            📝
          </button>
        </div>
      </div>
    </SectionCard>
  );
};

// Composant AddMealCard
const AddMealCard = ({ onAdd }) => {
  return (
    <SectionCard
      title="Nouveau repas"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      }
      color="green"
      className="border-2 border-dashed border-slate-600 hover:border-green-500 cursor-pointer transition-colors"
    >
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🍽️</div>
        <p className="text-slate-400 mb-4">Ajoutez un repas pour l'analyser</p>
        <button 
          onClick={onAdd}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Ajouter un repas
        </button>
      </div>
    </SectionCard>
  );
};

// Composant NutritionChart
const NutritionChart = ({ data }) => {
  const total = data.protein + data.carbs + data.fat;
  const proteinPercent = (data.protein * 4 / (total * 4)) * 100; // 4 kcal/g
  const carbsPercent = (data.carbs * 4 / (total * 4)) * 100; // 4 kcal/g
  const fatPercent = (data.fat * 9 / (total * 4)) * 100; // 9 kcal/g

  return (
    <SectionCard
      title="Répartition nutritionnelle"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2" />
        </svg>
      }
      color="blue"
    >
      <div className="space-y-4">
        {/* Barres de progression */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-400">Protéines</span>
              <span className="text-slate-300">{data.protein}g ({Math.round(proteinPercent)}%)</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: `${proteinPercent}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-yellow-400">Glucides</span>
              <span className="text-slate-300">{data.carbs}g ({Math.round(carbsPercent)}%)</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${carbsPercent}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-400">Lipides</span>
              <span className="text-slate-300">{data.fat}g ({Math.round(fatPercent)}%)</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-red-400 h-2 rounded-full" style={{ width: `${fatPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className="bg-slate-700/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-slate-200 mb-2">Recommandations</h4>
          <div className="text-xs text-slate-400 space-y-1">
            <div>• Protéines: 25-30% des calories</div>
            <div>• Glucides: 45-50% des calories</div>
            <div>• Lipides: 20-25% des calories</div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

// Composant principal MealAnalyzerV2
const MealAnalyzerV2 = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Données mockées pour démonstration
  const [todayMeals] = useState([
    {
      id: 1,
      name: 'Avocado Toast',
      emoji: '🥑',
      time: '08:30',
      type: 'Petit-déjeuner',
      calories: 320,
      macros: { protein: 12, carbs: 28, fat: 18 },
      healthScore: 85,
      aiAnalysis: 'Excellent choix ! Riche en bonnes graisses et fibres. Parfait pour commencer la journée.'
    },
    {
      id: 2,
      name: 'Salade César au Poulet',
      emoji: '🥗',
      time: '12:45',
      type: 'Déjeuner',
      calories: 450,
      macros: { protein: 35, carbs: 15, fat: 22 },
      healthScore: 75,
      aiAnalysis: 'Bon équilibre protéique ! Attention à la sauce César qui peut être riche en calories.'
    },
    {
      id: 3,
      name: 'Smoothie Protéiné',
      emoji: '🥤',
      time: '16:20',
      type: 'Collation',
      calories: 280,
      macros: { protein: 25, carbs: 20, fat: 8 },
      healthScore: 90,
      aiAnalysis: 'Parfait pour la récupération ! Excellent ratio protéines/glucides.'
    }
  ]);

  const [dailyStats] = useState({
    totalCalories: todayMeals.reduce((acc, meal) => acc + meal.calories, 0),
    totalProtein: todayMeals.reduce((acc, meal) => acc + meal.macros.protein, 0),
    totalCarbs: todayMeals.reduce((acc, meal) => acc + meal.macros.carbs, 0),
    totalFat: todayMeals.reduce((acc, meal) => acc + meal.macros.fat, 0),
    averageHealthScore: Math.round(todayMeals.reduce((acc, meal) => acc + meal.healthScore, 0) / todayMeals.length),
    mealsCount: todayMeals.length
  });

  const handleAnalyzeMeal = (mealId) => {
    console.log('Analyze meal:', mealId);
  };

  const handleAddMeal = () => {
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Analyse Nutritionnelle</h1>
          <p className="text-slate-400 mt-1">Suivez et analysez vos repas avec l'IA</p>
        </div>
        <button 
          onClick={handleAddMeal}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter un repas
        </button>
      </div>

      {/* Statistiques du jour */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Calories totales"
          value={dailyStats.totalCalories}
          unit="kcal"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
          color="red"
        />

        <MetricCard
          title="Protéines"
          value={dailyStats.totalProtein}
          unit="g"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          color="green"
        />

        <MetricCard
          title="Score santé moy."
          value={dailyStats.averageHealthScore}
          unit="/100"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          color="blue"
        />

        <MetricCard
          title="Repas du jour"
          value={dailyStats.mealsCount}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          color="cyan"
        />
      </div>

      {/* Graphique nutritionnel et repas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Répartition nutritionnelle */}
        <div className="lg:col-span-1">
          <NutritionChart data={dailyStats} />
        </div>

        {/* Liste des repas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-slate-100">Repas d'aujourd'hui</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayMeals.map(meal => (
              <MealCard 
                key={meal.id} 
                meal={meal} 
                onAnalyze={handleAnalyzeMeal}
              />
            ))}
            
            {/* Carte d'ajout */}
            <AddMealCard onAdd={handleAddMeal} />
          </div>
        </div>
      </div>

      {/* Conseils IA */}
      <SectionCard
        title="Conseils Nutritionnels IA"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
        color="purple"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Excellente journée nutritionnelle ! Votre apport en protéines est optimal pour la récupération musculaire. 💪
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Pensez à ajouter plus de légumes verts à votre prochain repas pour augmenter l'apport en fibres. 🥬
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Votre timing nutritionnel est parfait ! Le smoothie protéiné après l'entraînement optimise la récupération. ⏰
            </p>
          </div>
        </div>
      </SectionCard>

    </div>
  );
};

export default MealAnalyzerV2;
