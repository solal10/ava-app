import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, BarChart3, Target } from 'lucide-react';

/**
 * Composant de gestion du consentement aux cookies
 * Conforme CNIL/RGPD avec granularité fine
 */
const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consents, setConsents] = useState({
    essential: true, // Toujours activés
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const savedConsent = localStorage.getItem('ava_cookie_consent');
    if (!savedConsent) {
      setIsVisible(true);
    } else {
      setConsents(JSON.parse(savedConsent));
    }
  }, []);

  const saveConsents = async (finalConsents = consents) => {
    try {
      // Sauvegarder localement
      localStorage.setItem('ava_cookie_consent', JSON.stringify(finalConsents));
      localStorage.setItem('ava_cookie_consent_date', new Date().toISOString());

      // Envoyer au backend si utilisateur connecté
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/user/cookie-consents', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ cookieConsents: finalConsents })
        });
      }

      // Appliquer les consentements
      applyCookieConsents(finalConsents);
      
      setIsVisible(false);
      setShowSettings(false);
    } catch (error) {
      console.error('Erreur sauvegarde consentements cookies:', error);
    }
  };

  const applyCookieConsents = (cookieConsents) => {
    // Google Analytics / Analytics
    if (cookieConsents.analytics) {
      // Activer Google Analytics ou autre outil d'analytics
      if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
          'analytics_storage': 'granted'
        });
      }
    } else {
      // Désactiver analytics
      if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
          'analytics_storage': 'denied'
        });
      }
    }

    // Marketing / Réseaux sociaux
    if (cookieConsents.marketing) {
      // Activer pixels de tracking, réseaux sociaux
      if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
          'ad_storage': 'granted'
        });
      }
    } else {
      // Désactiver marketing
      if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
          'ad_storage': 'denied'
        });
      }
    }

    // Fonctionnel (préférences utilisateur)
    if (!cookieConsents.functional) {
      // Nettoyer les cookies fonctionnels non essentiels
      localStorage.removeItem('user_preferences_non_essential');
    }

    // Déclencher événement personnalisé pour autres composants
    window.dispatchEvent(new CustomEvent('cookieConsentsUpdated', {
      detail: cookieConsents
    }));
  };

  const acceptAll = () => {
    const fullConsents = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setConsents(fullConsents);
    saveConsents(fullConsents);
  };

  const acceptEssentialOnly = () => {
    const essentialOnly = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setConsents(essentialOnly);
    saveConsents(essentialOnly);
  };

  const handleConsentChange = (category, value) => {
    setConsents(prev => ({
      ...prev,
      [category]: value
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-t-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {!showSettings ? (
          // Banner principal
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Gestion des cookies
                </h2>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Nous utilisons des cookies pour améliorer votre expérience sur AVA Coach Santé IA. 
                Certains cookies sont essentiels au fonctionnement du site, d'autres nous permettent 
                d'analyser l'utilisation et de personnaliser le contenu.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>🔒 Vos données de santé :</strong> Nos cookies n'accèdent jamais directement 
                  à vos données de santé personnelles. Elles sont protégées par chiffrement et stockées 
                  séparément avec les plus hauts standards de sécurité.
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Vous pouvez accepter tous les cookies, personnaliser vos choix ou accepter seulement 
                les cookies essentiels. Vous pourrez modifier ces préférences à tout moment dans vos paramètres.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={acceptAll}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex-1"
              >
                Accepter tous les cookies
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Personnaliser
              </button>
              
              <button
                onClick={acceptEssentialOnly}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors flex-1"
              >
                Cookies essentiels uniquement
              </button>
            </div>

            <div className="mt-4 text-center">
              <a 
                href="/privacy-policy" 
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                Consulter notre politique de confidentialité
              </a>
            </div>
          </div>
        ) : (
          // Paramètres détaillés
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Paramètres des cookies
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Cookies essentiels */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Cookies essentiels</h3>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    Toujours activés
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Ces cookies sont nécessaires au fonctionnement du site et à votre sécurité. 
                  Ils permettent la navigation, l'authentification et la protection contre les attaques.
                </p>
                <p className="text-xs text-gray-500">
                  Exemples : session utilisateur, protection CSRF, préférences de langue
                </p>
              </div>

              {/* Cookies fonctionnels */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Cookies fonctionnels</h3>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={consents.functional}
                      onChange={(e) => handleConsentChange('functional', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Ces cookies améliorent votre expérience en mémorisant vos préférences 
                  et personnalisations non essentielles.
                </p>
                <p className="text-xs text-gray-500">
                  Exemples : thème d'affichage, préférences d'interface, paramètres de coaching
                </p>
              </div>

              {/* Cookies analytics */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Cookies d'analyse</h3>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={consents.analytics}
                      onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Ces cookies nous aident à comprendre comment vous utilisez l'application 
                  pour l'améliorer. Les données sont anonymisées et agrégées.
                </p>
                <p className="text-xs text-gray-500">
                  Exemples : pages visitées, temps de session, parcours utilisateur (anonymisé)
                </p>
              </div>

              {/* Cookies marketing */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Cookies marketing</h3>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={consents.marketing}
                      onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Ces cookies permettent de personnaliser les contenus publicitaires 
                  et de mesurer l'efficacité de nos campagnes marketing.
                </p>
                <p className="text-xs text-gray-500">
                  Exemples : suivi des conversions, personnalisation des recommandations
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => saveConsents()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex-1"
              >
                Enregistrer mes préférences
              </button>
              
              <button
                onClick={acceptAll}
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Tout accepter
              </button>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>💡 À savoir :</strong> Vous pouvez modifier ces paramètres à tout moment 
                depuis votre profil utilisateur. La désactivation de certains cookies peut limiter 
                certaines fonctionnalités de l'application.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;