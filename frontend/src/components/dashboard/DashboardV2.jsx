import React, { useState, useEffect } from 'react';

// Composant CircularScoreGauge
const CircularScoreGauge = ({ score, size = 120 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(51 65 85)"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(34 211 238)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-100">{score}</span>
        <span className="text-xs text-slate-400">Health Score</span>
      </div>
    </div>
  );
};

// Composant HealthLineChart
const HealthLineChart = ({ data }) => {
  const maxValue = Math.max(...data.sleep, ...data.energy, ...data.stress);
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const getPath = (values, color) => {
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 280;
      const y = 120 - (value / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    return `M ${points.replace(/,/g, ' L ')}`;
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Health Metrics (7 days)</h3>
      
      {/* Legend */}
      <div className="flex gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span className="text-sm text-slate-300">Sleep</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-sm text-slate-300">Energy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span className="text-sm text-slate-300">Stress</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg width="300" height="140" className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={120 - y}
              x2="280"
              y2={120 - y}
              stroke="rgb(51 65 85)"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          
          {/* Sleep line */}
          <path
            d={getPath(data.sleep, 'blue')}
            stroke="rgb(96 165 250)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Energy line */}
          <path
            d={getPath(data.energy, 'green')}
            stroke="rgb(74 222 128)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Stress line */}
          <path
            d={getPath(data.stress, 'red')}
            stroke="rgb(248 113 113)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.sleep.map((value, index) => (
            <circle
              key={`sleep-${index}`}
              cx={(index / (data.sleep.length - 1)) * 280}
              cy={120 - (value / maxValue) * 100}
              r="4"
              fill="rgb(96 165 250)"
            />
          ))}
        </svg>
        
        {/* Day labels */}
        <div className="flex justify-between mt-2 px-1">
          {days.map((day, index) => (
            <span key={day} className="text-xs text-slate-400">{day}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Composant IAInsightCard
const IAInsightCard = ({ insight }) => {
  return (
    <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center">
          <span className="text-slate-900 font-bold text-sm">AI</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">Today's Insight</h3>
          <p className="text-slate-300 leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  );
};

// Composant GoalCard
const GoalCard = ({ goal }) => {
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-400';
    if (progress >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{goal.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-100">{goal.title}</h4>
          <p className="text-sm text-slate-400">{goal.frequency}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">Progress</span>
          <span className="text-slate-300">{goal.current}/{goal.target}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(goal.progress)}`}
            style={{ width: `${goal.progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Composant MealCard
const MealCard = ({ meal }) => {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-slate-100">{meal.name}</h4>
          <p className="text-sm text-slate-400">{meal.time}</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-cyan-400">{meal.calories}</span>
          <span className="text-sm text-slate-400 ml-1">kcal</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-sm font-semibold text-green-400">{meal.macros.protein}g</div>
          <div className="text-xs text-slate-400">Prot</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-yellow-400">{meal.macros.carbs}g</div>
          <div className="text-xs text-slate-400">Gluc</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-red-400">{meal.macros.fat}g</div>
          <div className="text-xs text-slate-400">Lip</div>
        </div>
      </div>
    </div>
  );
};

// Composant principal DashboardV2
const DashboardV2 = () => {
  const [userName] = useState('Thomas');
  const [healthScore] = useState(78);
  const [aiMessage] = useState("You've been getting less sleep lately. Aim to get some extra rest.");
  const [aiInsight] = useState("I noticed you only slept 5h last night. Try to get 7-9h to recover properly. Your stress levels are also elevated - consider some meditation or light exercise.");

  const [healthData] = useState({
    sleep: [7.5, 6.2, 8.1, 5.8, 7.0, 6.5, 8.2],
    energy: [85, 72, 90, 65, 78, 75, 88],
    stress: [25, 45, 20, 60, 35, 40, 22]
  });

  const [goals] = useState([
    {
      id: 1,
      title: 'Daily Steps',
      icon: '🚶‍♂️',
      frequency: 'Daily',
      current: 8500,
      target: 10000,
      progress: 85
    },
    {
      id: 2,
      title: 'Sleep Duration',
      icon: '😴',
      frequency: 'Nightly',
      current: 6.5,
      target: 8,
      progress: 81
    },
    {
      id: 3,
      title: 'Water Intake',
      icon: '💧',
      frequency: 'Daily',
      current: 1.8,
      target: 2.5,
      progress: 72
    }
  ]);

  const [recentMeals] = useState([
    {
      id: 1,
      name: 'Avocado Toast',
      time: '08:30',
      calories: 320,
      macros: { protein: 12, carbs: 28, fat: 18 }
    },
    {
      id: 2,
      name: 'Grilled Chicken Salad',
      time: '12:45',
      calories: 450,
      macros: { protein: 35, carbs: 15, fat: 22 }
    },
    {
      id: 3,
      name: 'Protein Smoothie',
      time: '16:20',
      calories: 280,
      macros: { protein: 25, carbs: 20, fat: 8 }
    }
  ]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-100">
            {getGreeting()}, {userName}
          </h1>
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 border border-slate-600">
            <p className="text-slate-300 leading-relaxed">{aiMessage}</p>
          </div>
        </div>

        {/* Score and Insight Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Health Score */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col items-center justify-center">
            <CircularScoreGauge score={healthScore} size={140} />
            <p className="text-sm text-slate-400 mt-4 text-center">
              Your overall health score based on sleep, activity, and nutrition
            </p>
          </div>

          {/* AI Insight */}
          <div className="lg:col-span-2">
            <IAInsightCard insight={aiInsight} />
          </div>
        </div>

        {/* Health Metrics Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <HealthLineChart data={healthData} />
          </div>
          
          {/* Goals Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-100">Active Goals</h2>
            <div className="space-y-3">
              {goals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Meals Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Recent Meals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMeals.map(meal => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-4 transition-all duration-200 hover:scale-105">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium">View Analytics</div>
            </button>
            <button className="bg-green-600 hover:bg-green-500 text-white rounded-xl p-4 transition-all duration-200 hover:scale-105">
              <div className="text-2xl mb-2">🥗</div>
              <div className="text-sm font-medium">Log Meal</div>
            </button>
            <button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-4 transition-all duration-200 hover:scale-105">
              <div className="text-2xl mb-2">💪</div>
              <div className="text-sm font-medium">Start Workout</div>
            </button>
            <button className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl p-4 transition-all duration-200 hover:scale-105">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm font-medium">Set Goal</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardV2;
