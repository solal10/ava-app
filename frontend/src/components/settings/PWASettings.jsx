import React from 'react';
import SectionCard from '../layout/SectionCard';
import PWAFeatures from '../pwa/PWAFeatures';

const PWASettings = () => {
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  return (
    <div className="space-y-6">
      
      {/* En-tête avec statut PWA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Application Mobile</h1>
          <p className="text-slate-400 mt-1">
            {isPWA 
              ? "🎉 Application installée et active"
              : "Transformez AVA Coach en application native"
            }
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isPWA 
            ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
            : 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
        }`}>
          {isPWA ? '📱 Installée' : '🌐 Web'}
        </div>
      </div>

      {/* Fonctionnalités PWA */}
      <SectionCard
        title="Fonctionnalités Avancées"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
        color="blue"
      >
        <PWAFeatures />
      </SectionCard>

      {/* Avantages de l'installation */}
      <SectionCard
        title="Pourquoi installer AVA Coach ?"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        color="cyan"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Avantage 1 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Accès ultra-rapide</h3>
              <p className="text-sm text-slate-400">
                Lancez votre coach santé en un clic depuis votre écran d'accueil
              </p>
            </div>
          </div>

          {/* Avantage 2 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Fonctionnement hors ligne</h3>
              <p className="text-sm text-slate-400">
                Consultez vos données et utilisez les fonctions de base même sans connexion
              </p>
            </div>
          </div>

          {/* Avantage 3 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.07 14C10.25 13.09 10.5 12.2 10.81 11.37C9.75 10.81 8.5 10.5 7.13 10.5C5.76 10.5 4.51 10.81 3.45 11.37C3.76 12.2 4.01 13.09 4.19 14H10.07z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Notifications intelligentes</h3>
              <p className="text-sm text-slate-400">
                Recevez des rappels personnalisés pour vos objectifs santé
              </p>
            </div>
          </div>

          {/* Avantage 4 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Moins d'espace</h3>
              <p className="text-sm text-slate-400">
                Plus léger qu'une app native, mises à jour automatiques
              </p>
            </div>
          </div>

        </div>
      </SectionCard>

      {/* Instructions d'installation */}
      {!isPWA && (
        <SectionCard
          title="Comment installer ?"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="gray"
        >
          <div className="space-y-4">
            
            {/* Chrome/Edge */}
            <div className="border border-slate-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.2 8.3l-2.1 3.6c-1.5-2.6-4.2-4.2-7.1-4.2h3.6c1.8 0 3.4 1 4.2 2.5l.2.4c.2.4.3.8.3 1.3 0 1.7-1.3 3-3 3-1.7 0-3-1.3-3-3h-2c0 2.8 2.2 5 5 5s5-2.2 5-5c0-.8-.2-1.6-.5-2.3l2.4-1.3z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-200">Chrome / Edge</h3>
              </div>
              <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                <li>Cliquez sur le bouton "Installer" qui apparaît automatiquement</li>
                <li>Ou cliquez sur les 3 points → "Installer AVA Coach..."</li>
                <li>Confirmez l'installation</li>
              </ol>
            </div>

            {/* Safari */}
            <div className="border border-slate-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm0-2a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-16a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-200">Safari (iOS)</h3>
              </div>
              <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                <li>Appuyez sur le bouton de partage 📤</li>
                <li>Sélectionnez "Sur l'écran d'accueil"</li>
                <li>Personnalisez le nom si souhaité</li>
                <li>Appuyez sur "Ajouter"</li>
              </ol>
            </div>

          </div>
        </SectionCard>
      )}

      {/* Félicitations si installé */}
      {isPWA && (
        <SectionCard
          title="Application Installée !"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        >
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              AVA Coach est maintenant installé !
            </h3>
            <p className="text-slate-400 text-sm">
              Profitez de l'expérience optimale avec toutes les fonctionnalités avancées.
              L'application se met à jour automatiquement.
            </p>
          </div>
        </SectionCard>
      )}

    </div>
  );
};

export default PWASettings;