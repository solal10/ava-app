import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';

const NavBar = ({ user, onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isPremium } = useSubscription();

  const navigationItems = [
    { title: 'Accueil', path: '/', icon: '🏠' },
    { title: 'Santé', path: '/health', icon: '📊' },
    { title: 'Objectifs', path: '/goals/tracker', icon: '🏆' },
    { title: 'Conseils', path: '/advice', icon: '💡' },
    { title: 'Programme', path: '/programme', icon: '💪' },
    { title: 'Repas', path: '/repas', icon: '🍽️' },
    { title: 'Messages', path: '/messages', icon: '💬' },
    { title: 'Évolution', path: '/evolution', icon: '📈' },
    { title: 'Chat IA', path: '/chat', icon: '🤖' }
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏥</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Coach Santé</span>
                {user?.isPremium && (
                  <span className="text-xs text-yellow-600 font-medium">Premium</span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath(item.path)
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden lg:block">{item.title}</span>
              </Link>
            ))}
            
            {/* Premium Button */}
            {!user?.isPremium && (
              <Link
                to="/upgrade"
                className="ml-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-sm"
              >
                ⭐ Premium
              </Link>
            )}
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="ml-4 text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
              title="Déconnexion"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  isActivePath(item.path)
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            ))}
            
            {/* Mobile Premium Button */}
            {!user?.isPremium && (
              <Link
                to="/upgrade"
                className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-lg">⭐</span>
                <span>Passer Premium</span>
              </Link>
            )}
            
            {/* Mobile Logout Button */}
            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
