import React from 'react';

const TestTailwind = () => {
  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4 my-4">
      <div className="shrink-0">
        <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">✓</span>
        </div>
      </div>
      <div>
        <h4 className="text-xl font-medium text-black">Tailwind CSS Test</h4>
        <p className="text-green-500">Si ce texte est vert, Tailwind fonctionne correctement!</p>
        <p className="text-red-500 mt-2">Ce texte doit être rouge</p>
        <p className="text-blue-500 mt-2">Ce texte doit être bleu</p>
        <div className="mt-4 bg-yellow-200 p-2 rounded">
          <p className="text-yellow-800">Fond jaune avec texte foncé</p>
        </div>
      </div>
    </div>
  );
};

export default TestTailwind;
