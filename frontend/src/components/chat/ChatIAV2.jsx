import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatAPI } from '../../utils/api';
import { useSubscription } from '../../contexts/SubscriptionContext';
import SectionCard, { MetricCard } from '../layout/SectionCard';
import { useApiErrorHandler } from '../../hooks/useErrorHandler';
import { useLoading } from '../../hooks/useLoading';
import { LoadableContent, LoadableButton } from '../common/SmartLoader';

// Composant Message modernisé
const MessageBubble = ({ message, isUser }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? 'bg-cyan-600 text-white' 
            : 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white'
        }`}>
          {isUser ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <span className="text-xs font-bold">AI</span>
          )}
        </div>

        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-cyan-600 text-white' 
            : 'bg-slate-700 text-slate-100 border border-slate-600'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <div className={`text-xs mt-2 ${
            isUser ? 'text-cyan-100' : 'text-slate-400'
          }`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant QuickActions
const QuickActions = ({ onQuickMessage, disabled }) => {
  const quickMessages = [
    { icon: '💪', text: 'Conseils d\'entraînement', message: 'Donne-moi des conseils pour améliorer mes entraînements' },
    { icon: '🥗', text: 'Nutrition', message: 'Comment améliorer mon alimentation ?' },
    { icon: '😴', text: 'Sommeil', message: 'Aide-moi à mieux dormir' },
    { icon: '🎯', text: 'Objectifs', message: 'Comment atteindre mes objectifs santé ?' }
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {quickMessages.map((action, index) => (
        <button
          key={index}
          onClick={() => onQuickMessage(action.message)}
          disabled={disabled}
          className="flex items-center gap-2 p-3 bg-slate-700/50 hover:bg-slate-700 disabled:hover:bg-slate-700/50 border border-slate-600 rounded-xl transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg">{action.icon}</span>
          <span className="text-sm text-slate-300">{action.text}</span>
        </button>
      ))}
    </div>
  );
};

// Composant ChatStats
const ChatStats = ({ requestCount, isPremium, messagesCount }) => {
  const maxRequests = 10;
  const remainingRequests = isPremium ? '∞' : Math.max(0, maxRequests - requestCount);
  const usagePercent = isPremium ? 0 : (requestCount / maxRequests) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <MetricCard
        title="Messages échangés"
        value={messagesCount}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        }
        color="cyan"
      />

      <MetricCard
        title="Requêtes restantes"
        value={remainingRequests}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        color={isPremium ? "green" : usagePercent > 80 ? "red" : "yellow"}
      />

      <MetricCard
        title="Statut"
        value={isPremium ? "Premium" : "Gratuit"}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        }
        color={isPremium ? "purple" : "gray"}
      />
    </div>
  );
};

// Composant principal ChatIAV2
const ChatIAV2 = ({ user }) => {
  const { isPremium } = useSubscription();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ia',
      content: 'Bonjour ! Je suis votre coach santé IA. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [requestCount, setRequestCount] = useState(0);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Utiliser les nouveaux hooks de loading et d'erreur
  const { startLoading, stopLoading, isLoadingKey } = useLoading();
  const { handleApiError } = useApiErrorHandler('ChatIA');

  // Fonction pour logger les messages dans le système Learn
  function logToLearnSystem(message) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    fetch('http://localhost:5003/api/learn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        type: 'chat',
        context: message,
        result: 'Message utilisateur envoyé'
      })
    }).catch(err => console.error('Erreur Learn API:', err));
  }

  // Récupération du nombre de requêtes déjà utilisées depuis le backend
  useEffect(() => {
    const fetchRequestCount = async () => {
      if (!isPremium) {
        try {
          const response = await chatAPI.getRequestCount();
          const count = response.count || 0;
          setRequestCount(count);
          setHasReachedLimit(count >= 10);
        } catch (error) {
          console.error('Erreur lors de la récupération du nombre de requêtes:', error);
        }
      }
    };

    fetchRequestCount();
  }, [isPremium]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageText = null) => {
    const messageToSend = messageText || inputMessage.trim();
    if (!messageToSend || isLoadingKey('chat')) return;

    // Vérification de la limite pour les utilisateurs non-premium
    if (!isPremium && hasReachedLimit) {
      return;
    }

    // Ajouter le message utilisateur
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    startLoading('chat');

    // Logger le message
    logToLearnSystem(messageToSend);

    try {
      const response = await chatAPI.sendMessage(messageToSend);
      
      // Ajouter la réponse de l'IA
      const iaMessage = {
        id: Date.now() + 1,
        sender: 'ia',
        content: response.message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, iaMessage]);

      // Mettre à jour le compteur de requêtes
      if (!isPremium) {
        const newCount = requestCount + 1;
        setRequestCount(newCount);
        setHasReachedLimit(newCount >= 10);
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      handleApiError(error, 'envoi de message');
      
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ia',
        content: 'Désolé, une erreur s\'est produite. Veuillez réessayer plus tard.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      stopLoading('chat');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickMessage = (message) => {
    handleSendMessage(message);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        sender: 'ia',
        content: 'Bonjour ! Je suis votre coach santé IA. Comment puis-je vous aider aujourd\'hui ?',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Coach IA</h1>
          <p className="text-slate-400 mt-1">Votre assistant santé personnel alimenté par l'IA</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={clearChat}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Effacer
          </button>
          {!isPremium && (
            <Link 
              to="/premium"
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <ChatStats 
        requestCount={requestCount} 
        isPremium={isPremium} 
        messagesCount={messages.length - 1} // -1 pour exclure le message de bienvenue
      />

      {/* Zone de chat */}
      <SectionCard
        title="Conversation"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        }
        color="cyan"
        className="h-[600px] flex flex-col"
      >
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isUser={message.sender === 'user'} 
              />
            ))}
            
            {/* Indicateur de chargement */}
            {isLoadingKey('chat') && (
              <div className="flex justify-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                  <div className="bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Actions rapides */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Actions rapides</h4>
              <QuickActions 
                onQuickMessage={handleQuickMessage} 
                disabled={isLoadingKey('chat') || (!isPremium && hasReachedLimit)}
              />
            </div>
          )}

          {/* Zone de saisie */}
          <div className="p-4 border-t border-slate-700">
            {/* Limite atteinte pour utilisateurs non-premium */}
            {!isPremium && hasReachedLimit && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-xl">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Limite de 10 messages atteinte.</span>
                  <Link to="/premium" className="text-purple-400 hover:text-purple-300 underline">
                    Passez Premium
                  </Link>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    !isPremium && hasReachedLimit 
                      ? "Limite atteinte - Passez Premium pour continuer" 
                      : "Tapez votre message..."
                  }
                  disabled={isLoadingKey('chat') || (!isPremium && hasReachedLimit)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  rows="2"
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoadingKey('chat') || (!isPremium && hasReachedLimit)}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center"
              >
                {isLoadingKey('chat') ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Conseils d'utilisation */}
      <SectionCard
        title="Conseils d'utilisation"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
        color="blue"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Soyez spécifique</h4>
            <p className="text-sm text-slate-400">
              Plus vous donnez de détails sur votre situation, plus les conseils seront personnalisés et utiles.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Posez des questions ouvertes</h4>
            <p className="text-sm text-slate-400">
              N'hésitez pas à demander "Comment puis-je..." ou "Que recommandes-tu pour..." pour obtenir des conseils détaillés.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Mentionnez vos objectifs</h4>
            <p className="text-sm text-slate-400">
              Partagez vos objectifs de santé pour que l'IA puisse adapter ses recommandations à vos besoins.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Suivez les conseils</h4>
            <p className="text-sm text-slate-400">
              L'IA apprend de vos interactions. Plus vous suivez et donnez des retours, plus elle s'améliore.
            </p>
          </div>
        </div>
      </SectionCard>

    </div>
  );
};

export default ChatIAV2;
