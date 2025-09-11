import React, { useState } from 'react';
import SidebarNav from './SidebarNav';
import BottomNav from './BottomNav';

const MainLayout = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          {/* Logo et nom de l'app */}
          <div className="flex items-center gap-3">
            {/* Menu burger pour mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <h1 className="text-xl font-bold text-slate-100 hidden sm:block">Coach Santé</h1>
            </div>
          </div>

          {/* Avatar utilisateur et déconnexion */}
          <div className="flex items-center gap-3">
            {user?.isPremium && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                PREMIUM
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.prenom?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="text-slate-300 text-sm hidden sm:block">
                {user?.prenom || 'Utilisateur'}
              </span>
            </div>
            
            {/* Bouton de déconnexion */}
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/auth';
              }}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200"
              title="Se déconnecter"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          <SidebarNav />
        </div>

        {/* Sidebar Mobile (overlay) */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar */}
            <div className="absolute left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700">
              <div className="p-4 border-b border-slate-700">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarNav onItemClick={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <main className="flex-1 pb-16 lg:pb-0">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation Mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;
