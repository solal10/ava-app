import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatAPI } from '../../utils/api';
import { useSubscription } from '../../contexts/SubscriptionContext';

const ChatIA = ({ user }) => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const messagesEndRef = useRef(null);

  // Fonction pour logger les messages dans le système Learn
  function logToLearnSystem(message) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    fetch('http://localhost:3000/api/learn', {
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
      // Vérification nécessaire uniquement pour les utilisateurs non-premium
      if (!isPremium) {
        try {
          const response = await chatAPI.getRequestCount();
          const count = response.count || 0;
          setRequestCount(count);
          setHasReachedLimit(count >= 3);
        } catch (error) {
          console.error('Erreur lors de la récupération du compteur de requêtes:', error);
          // Fallback sur localStorage en cas d'erreur
          const storedCount = localStorage.getItem('ia_request_count') || '0';
          const count = parseInt(storedCount, 10);
          setRequestCount(count);
          setHasReachedLimit(count >= 3);
        }
      }
    };
    
    if (user) {
      fetchRequestCount();
    }
  }, [user, isPremium]);

  // Scroll automatique vers le bas lors de l'ajout de nouveaux messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier si le message n'est pas vide
    if (!inputMessage.trim()) return;

    // Vérifier la limite pour les utilisateurs non-premium
    if (!isPremium && requestCount >= 3) {
      setHasReachedLimit(true);
      return;
    }

    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Logger le message utilisateur dans le système Learn
    logToLearnSystem(inputMessage);

    try {
      // Envoi du message à l'API backend
      const response = await chatAPI.sendMessage(inputMessage);
      
      // Ajouter la réponse de l'IA
      const iaMessage = {
        id: messages.length + 2,
        sender: 'ia',
        content: response.answer || "Je n'ai pas pu comprendre votre demande.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, iaMessage]);
      
      // Mettre à jour le compteur pour les utilisateurs non-premium
      if (!isPremium) {
        const countResponse = await chatAPI.getRequestCount();
        const newCount = countResponse.count || requestCount + 1;
        setRequestCount(newCount);
        
        if (newCount >= 3) {
          setHasReachedLimit(true);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // Message d'erreur
      const errorMessage = {
        id: messages.length + 2,
        sender: 'ia',
        content: error.message || "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer plus tard.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Chat avec votre coach IA</h1>
        {!isPremium && (
          <p className="text-sm text-gray-600">
            {hasReachedLimit 
              ? 'Limite atteinte : 0 question restante aujourd\'hui' 
              : `${3 - requestCount} question(s) restante(s) aujourd\'hui`}
          </p>
        )}
        {isPremium && (
          <p className="text-sm text-green-600 flex items-center">
            <span className="mr-1">⭐</span>
            Mode Premium : Messages illimités
          </p>
        )}
      </div>

      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
        {/* Zone de messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${message.sender === 'user' ? 'text-right' : ''}`}
            >
              <div
                className={`inline-block rounded-lg py-2 px-4 max-w-xs md:max-w-md lg:max-w-lg ${
                  message.sender === 'user'
                    ? 'bg-primary-light text-white'
                    : message.isError
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-4">
              <div className="inline-block rounded-lg py-2 px-4 bg-gray-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="border-t p-4 bg-gray-50">
          {hasReachedLimit && !isPremium ? (
            <div className="text-center">
              <p className="text-gray-600 mb-3">
                Vous avez atteint votre limite de 3 questions par jour.
              </p>
              <Link to="/upgrade" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                Passer à l'abonnement Premium
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder="Posez une question à votre coach..."
                className="input flex-1 mr-2"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`btn btn-primary ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                Envoyer
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatIA;
