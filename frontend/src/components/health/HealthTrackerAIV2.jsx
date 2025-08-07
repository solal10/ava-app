import React, { useState, useEffect } from 'react';
import SectionCard, { MetricCard, StatCard } from '../layout/SectionCard';

// Composant CircularProgress pour les métriques
const CircularProgress = ({ value, maxValue, color, size = 80 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / maxValue) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(51 65 85)"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-100">{value}</span>
        <span className="text-xs text-slate-400">/{maxValue}</span>
      </div>
    </div>
  );
};

// Composant HealthChart simple
const HealthChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <SectionCard
      title={title}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2" />
        </svg>
      }
      color="blue"
    >
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-slate-300">{item.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-slate-100 w-8">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

// Composant principal HealthTrackerAIV2
const HealthTrackerAIV2 = ({ user }) => {
  const [loading, setLoading] = useState(false);
  
  // Données mockées pour démonstration
  const [healthMetrics] = useState({
    sleep: { current: 7.2, target: 8, unit: 'h' },
    steps: { current: 8500, target: 10000, unit: 'pas' },
    water: { current: 1.8, target: 2.5, unit: 'L' },
    calories: { current: 1850, target: 2200, unit: 'kcal' }
  });

  const [weeklyData] = useState([
    { label: 'Lun', sleep: 7.5, stress: 3, energy: 8 },
    { label: 'Mar', sleep: 6.8, stress: 5, energy: 6 },
    { label: 'Mer', sleep: 8.2, stress: 2, energy: 9 },
    { label: 'Jeu', sleep: 6.5, stress: 7, energy: 5 },
    { label: 'Ven', sleep: 7.8, stress: 4, energy: 7 },
    { label: 'Sam', sleep: 8.5, stress: 2, energy: 9 },
    { label: 'Dim', sleep: 7.9, stress: 3, energy: 8 }
  ]);

  const [aiInsights] = useState([
    "Votre sommeil s'améliore cette semaine (+12% par rapport à la semaine dernière)",
    "Votre niveau de stress est élevé le jeudi. Essayez une séance de méditation.",
    "Excellente hydratation ! Continuez à boire régulièrement dans la journée."
  ]);

  const getMetricColor = (current, target) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'rgb(34 197 94)'; // green
    if (percentage >= 70) return 'rgb(234 179 8)'; // yellow
    return 'rgb(239 68 68)'; // red
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Santé & Bien-être</h1>
          <p className="text-slate-400 mt-1">Suivez vos métriques de santé en temps réel</p>
        </div>
        <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl transition-colors">
          Synchroniser
        </button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SectionCard
          title="Sommeil"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          }
          color="blue"
          className="text-center"
        >
          <CircularProgress 
            value={healthMetrics.sleep.current} 
            maxValue={healthMetrics.sleep.target}
            color={getMetricColor(healthMetrics.sleep.current, healthMetrics.sleep.target)}
          />
          <p className="text-xs text-slate-400 mt-2">Objectif: {healthMetrics.sleep.target}h</p>
        </SectionCard>

        <SectionCard
          title="Activité"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          color="green"
          className="text-center"
        >
          <CircularProgress 
            value={healthMetrics.steps.current} 
            maxValue={healthMetrics.steps.target}
            color={getMetricColor(healthMetrics.steps.current, healthMetrics.steps.target)}
          />
          <p className="text-xs text-slate-400 mt-2">Objectif: {healthMetrics.steps.target.toLocaleString()} pas</p>
        </SectionCard>

        <SectionCard
          title="Hydratation"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
          color="cyan"
          className="text-center"
        >
          <CircularProgress 
            value={healthMetrics.water.current} 
            maxValue={healthMetrics.water.target}
            color={getMetricColor(healthMetrics.water.current, healthMetrics.water.target)}
          />
          <p className="text-xs text-slate-400 mt-2">Objectif: {healthMetrics.water.target}L</p>
        </SectionCard>

        <SectionCard
          title="Calories"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
          color="red"
          className="text-center"
        >
          <CircularProgress 
            value={healthMetrics.calories.current} 
            maxValue={healthMetrics.calories.target}
            color={getMetricColor(healthMetrics.calories.current, healthMetrics.calories.target)}
          />
          <p className="text-xs text-slate-400 mt-2">Objectif: {healthMetrics.calories.target} kcal</p>
        </SectionCard>
      </div>

      {/* Tendances hebdomadaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthChart 
          title="Sommeil (7 jours)"
          data={weeklyData.map(d => ({ label: d.label, value: d.sleep }))}
        />
        
        <HealthChart 
          title="Niveau d'énergie (7 jours)"
          data={weeklyData.map(d => ({ label: d.label, value: d.energy }))}
        />
      </div>

      {/* Insights IA */}
      <SectionCard
        title="Insights IA"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
        color="purple"
      >
        <div className="space-y-3">
          {aiInsights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Actions rapides */}
      <SectionCard
        title="Actions rapides"
        color="gray"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-3 transition-all duration-200 hover:scale-105">
            <div className="text-xl mb-1">😴</div>
            <div className="text-xs font-medium">Logger sommeil</div>
          </button>
          <button className="bg-green-600 hover:bg-green-500 text-white rounded-xl p-3 transition-all duration-200 hover:scale-105">
            <div className="text-xl mb-1">🚶‍♂️</div>
            <div className="text-xs font-medium">Activité</div>
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 transition-all duration-200 hover:scale-105">
            <div className="text-xl mb-1">💧</div>
            <div className="text-xs font-medium">Boire eau</div>
          </button>
          <button className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl p-3 transition-all duration-200 hover:scale-105">
            <div className="text-xl mb-1">📊</div>
            <div className="text-xs font-medium">Rapport</div>
          </button>
        </div>
      </SectionCard>

    </div>
  );
};

export default HealthTrackerAIV2;
