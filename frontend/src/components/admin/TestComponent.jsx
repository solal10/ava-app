import React from 'react';

const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Test Component - Route /admin/learn
          </h1>
          <p className="text-lg text-green-600 mb-4">
            ✅ Si vous voyez ce message, la route /admin/learn fonctionne !
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Diagnostic :</h2>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>✅ Route /admin/learn accessible</li>
              <li>✅ Authentification fonctionnelle</li>
              <li>✅ Composant React rendu correctement</li>
            </ul>
          </div>
          <div className="mt-6">
            <button 
              onClick={() => alert('Bouton fonctionnel !')}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
            >
              🔄 Test Bouton
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
