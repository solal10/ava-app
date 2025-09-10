import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <h1 className="text-4xl font-bold text-center">
          🏥 Coach Santé - Test Simple
        </h1>
        <p className="text-center mt-4 text-slate-300">
          Si vous voyez ce message, l'application React fonctionne !
        </p>
        
        <Routes>
          <Route path="*" element={
            <div className="text-center mt-8">
              <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-xl font-semibold mb-4">✅ Test réussi</h2>
                <p className="text-slate-400">
                  L'application React se charge correctement.
                  Le problème vient probablement d'un composant spécifique.
                </p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
