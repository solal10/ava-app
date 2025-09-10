import React, { useState, useEffect } from 'react';
import SectionCard, { MetricCard, StatCard, ProgressCard } from '../layout/SectionCard';

// Composant GoalCard modernisé
const GoalCard = ({ goal, onUpdate }) => {
  const getProgressColor = (progress) => {
    if (progress >= 90) return 'bg-green-400';
    if (progress >= 70) return 'bg-yellow-400';
    if (progress >= 50) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getStatusIcon = (progress) => {
    if (progress >= 90) return '🎉';
    if (progress >= 70) return '🔥';
    if (progress >= 50) return '⚡';
    return '💪';
  };

  return (
    <SectionCard
      title={goal.title}
      icon={
        <span className="text-2xl">{goal.icon}</span>
      }
      color={goal.color || 'cyan'}
      headerAction={
        <button 
          onClick={() => onUpdate(goal.id)}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded-lg transition-colors"
        >
          Modifier
        </button>
      }
    >
      <div className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">Progression</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getStatusIcon(goal.progress)}</span>
              <span className="text-sm font-semibold text-slate-100">
                {goal.current}/{goal.target} {goal.unit}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(goal.progress)}`}
              style={{ width: `${goal.progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{goal.frequency}</span>
            <span>{goal.progress}% complété</span>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-700/50 rounded-lg p-2">
            <div className="text-lg font-bold text-green-400">{goal.streak || 0}</div>
            <div className="text-xs text-slate-400">Série</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <div className="text-lg font-bold text-blue-400">{goal.daysLeft || 0}</div>
            <div className="text-xs text-slate-400">Jours restants</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm py-2 rounded-lg transition-colors">
            Mettre à jour
          </button>
          <button className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2 rounded-lg transition-colors">
            📊
          </button>
        </div>
      </div>
    </SectionCard>
  );
};

// Composant AddGoalCard
const AddGoalCard = ({ onAdd }) => {
  return (
    <SectionCard
      title="Nouvel objectif"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      }
      color="green"
      className="border-2 border-dashed border-slate-600 hover:border-green-500 cursor-pointer transition-colors"
    >
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🎯</div>
        <p className="text-slate-400 mb-4">Définissez un nouvel objectif pour rester motivé</p>
        <button 
          onClick={onAdd}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Créer un objectif
        </button>
      </div>
    </SectionCard>
  );
};

// Composant principal GoalsTrackerV2
const GoalsTrackerV2 = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Données mockées pour démonstration
  const [goals] = useState([
    {
      id: 1,
      title: 'Marcher 10 000 pas',
      icon: '🚶‍♂️',
      current: 8500,
      target: 10000,
      unit: 'pas',
      progress: 85,
      frequency: 'Quotidien',
      color: 'green',
      streak: 5,
      daysLeft: 30
    },
    {
      id: 2,
      title: 'Dormir 8 heures',
      icon: '😴',
      current: 7.2,
      target: 8,
      unit: 'h',
      progress: 90,
      frequency: 'Quotidien',
      color: 'blue',
      streak: 12,
      daysLeft: 30
    },
    {
      id: 3,
      title: 'Boire 2.5L d\'eau',
      icon: '💧',
      current: 1.8,
      target: 2.5,
      unit: 'L',
      progress: 72,
      frequency: 'Quotidien',
      color: 'cyan',
      streak: 3,
      daysLeft: 30
    },
    {
      id: 4,
      title: 'Méditation 15 min',
      icon: '🧘‍♂️',
      current: 10,
      target: 15,
      unit: 'min',
      progress: 67,
      frequency: 'Quotidien',
      color: 'purple',
      streak: 7,
      daysLeft: 30
    },
    {
      id: 5,
      title: 'Workout 3x/semaine',
      icon: '💪',
      current: 2,
      target: 3,
      unit: 'séances',
      progress: 67,
      frequency: 'Hebdomadaire',
      color: 'red',
      streak: 2,
      daysLeft: 4
    },
    {
      id: 6,
      title: 'Lire 30 pages',
      icon: '📚',
      current: 25,
      target: 30,
      unit: 'pages',
      progress: 83,
      frequency: 'Quotidien',
      color: 'yellow',
      streak: 8,
      daysLeft: 30
    }
  ]);

  const [weeklyStats] = useState({
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.progress >= 100).length,
    averageProgress: Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length),
    longestStreak: Math.max(...goals.map(g => g.streak || 0))
  });

  const handleUpdateGoal = (goalId) => {
    console.log('Update goal:', goalId);
  };

  const handleAddGoal = () => {
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Mes Objectifs</h1>
          <p className="text-slate-400 mt-1">Suivez vos objectifs et restez motivé</p>
        </div>
        <button 
          onClick={handleAddGoal}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouvel objectif
        </button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Objectifs actifs"
          value={weeklyStats.totalGoals}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          color="cyan"
        />

        <MetricCard
          title="Complétés"
          value={weeklyStats.completedGoals}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />

        <MetricCard
          title="Progression moy."
          value={weeklyStats.averageProgress}
          unit="%"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="blue"
        />

        <MetricCard
          title="Plus longue série"
          value={weeklyStats.longestStreak}
          unit="jours"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
          color="red"
        />
      </div>

      {/* Liste des objectifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => (
          <GoalCard 
            key={goal.id} 
            goal={goal} 
            onUpdate={handleUpdateGoal}
          />
        ))}
        
        {/* Carte d'ajout */}
        <AddGoalCard onAdd={handleAddGoal} />
      </div>

      {/* Insights IA */}
      <SectionCard
        title="Conseils IA"
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
              Excellent ! Vous êtes très proche d'atteindre votre objectif de sommeil. Continuez comme ça ! 😴
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Votre objectif d'hydratation pourrait être amélioré. Essayez de boire un verre d'eau toutes les heures. 💧
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-xl">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Votre série de méditation de 7 jours est impressionnante ! La régularité est la clé du succès. 🧘‍♂️
            </p>
          </div>
        </div>
      </SectionCard>

    </div>
  );
};

export default GoalsTrackerV2;
