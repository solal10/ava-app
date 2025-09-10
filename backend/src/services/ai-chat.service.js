const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

class AIChatService {
  constructor() {
    // Configuration des APIs
    this.openaiEnabled = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    this.claudeEnabled = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';
    
    // Initialisation des clients
    if (this.openaiEnabled) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI client initialisé');
    }
    
    if (this.claudeEnabled) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      console.log('✅ Claude client initialisé');
    }
    
    // Configuration par défaut
    this.defaultProvider = process.env.DEFAULT_AI_PROVIDER || 'openai';
    this.mockMode = !this.openaiEnabled && !this.claudeEnabled;
    
    if (this.mockMode) {
      console.warn('⚠️ Mode mock activé - Aucune clé API AI configurée');
      console.warn('🔑 Configurez OPENAI_API_KEY ou ANTHROPIC_API_KEY pour utiliser l\'IA réelle');
    }
    
    // Prompts système pour différents contextes
    this.systemPrompts = {
      health_coach: `Tu es AVA, un coach santé IA expert et bienveillant. Tu aides les utilisateurs à améliorer leur santé et bien-être à travers des conseils personnalisés.

TON RÔLE:
- Coach santé personnel et motivant
- Expert en nutrition, fitness, sommeil et gestion du stress
- Accompagnateur empathique et encourageant

DIRECTIVES:
- Réponds toujours en français
- Sois concis mais informatif (max 200 mots sauf demande spécifique)
- Donne des conseils pratiques et actionnables
- Adapte tes réponses au niveau d'abonnement de l'utilisateur
- Ne donne jamais de diagnostic médical
- Encourage à consulter un professionnel si nécessaire
- Utilise les données de santé de l'utilisateur pour personnaliser tes conseils

STYLE:
- Ton amical et motivant
- Utilise des emojis occasionnellement
- Exemple concret et pratique
- Questions pour engager l'utilisateur`,

      nutrition: `Tu es un expert en nutrition qui aide les utilisateurs d'AVA à améliorer leur alimentation.

SPÉCIALISATION:
- Analyse nutritionnelle des repas
- Recommandations alimentaires personnalisées  
- Plans de repas équilibrés
- Gestion des restrictions alimentaires

Utilise les données Spoonacular disponibles et donne des conseils pratiques et réalisables.`,

      fitness: `Tu es un coach sportif personnel qui aide les utilisateurs d'AVA à atteindre leurs objectifs fitness.

SPÉCIALISATION:
- Programmes d'entraînement personnalisés
- Conseils sur la récupération
- Motivation et encouragement
- Adaptation selon les données Garmin

Crée des programmes progressifs et sécuritaires adaptés au niveau de l'utilisateur.`,

      wellness: `Tu es un expert en bien-être qui aide les utilisateurs d'AVA à améliorer leur qualité de vie globale.

SPÉCIALISATION:
- Gestion du stress
- Optimisation du sommeil
- Équilibre vie-travail
- Techniques de relaxation et mindfulness

Utilise les données de stress et sommeil Garmin pour des conseils personnalisés.`
    };
  }

  // Générer une réponse de chat
  async generateResponse(message, context = {}) {
    try {
      const {
        userId,
        userProfile,
        healthData,
        chatHistory = [],
        responseType = 'health_coach',
        subscriptionLevel = 'explore',
        maxTokens = 300
      } = context;

      console.log(`🤖 Génération de réponse AI pour ${userId || 'utilisateur anonyme'}`);

      // Utiliser l'IA réelle si disponible
      if (!this.mockMode) {
        return await this.generateRealAIResponse(message, context, responseType, maxTokens);
      }

      // Mode mock avec réponses intelligentes
      return this.generateMockResponse(message, context, responseType);

    } catch (error) {
      console.error('❌ Erreur génération réponse AI:', error);
      
      // Fallback vers réponse mock en cas d'erreur
      return this.generateMockResponse(message, context);
    }
  }

  // Générer réponse avec IA réelle
  async generateRealAIResponse(message, context, responseType, maxTokens) {
    const systemPrompt = this.systemPrompts[responseType] || this.systemPrompts.health_coach;
    const provider = this.selectProvider(context.preferredProvider);
    
    // Construire le contexte personnalisé
    const personalizedContext = this.buildPersonalizedContext(context);
    const fullPrompt = `${systemPrompt}\n\n${personalizedContext}\n\nUtilisateur: ${message}`;

    if (provider === 'claude' && this.claudeEnabled) {
      return await this.generateClaudeResponse(fullPrompt, maxTokens);
    } else if (provider === 'openai' && this.openaiEnabled) {
      return await this.generateOpenAIResponse(fullPrompt, maxTokens, context.chatHistory);
    }

    // Fallback si le provider préféré n'est pas disponible
    throw new Error('Aucun provider AI disponible');
  }

  // Générer réponse avec Claude
  async generateClaudeResponse(prompt, maxTokens) {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return {
      response: response.content[0].text,
      provider: 'claude',
      model: 'claude-3-sonnet',
      tokens: response.usage?.input_tokens + response.usage?.output_tokens,
      cost: this.calculateCost('claude', response.usage?.input_tokens, response.usage?.output_tokens)
    };
  }

  // Générer réponse avec OpenAI
  async generateOpenAIResponse(prompt, maxTokens, chatHistory = []) {
    const messages = [
      { role: 'system', content: prompt }
    ];

    // Ajouter l'historique de conversation (max 10 derniers messages)
    const recentHistory = chatHistory.slice(-10);
    messages.push(...recentHistory);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    return {
      response: response.choices[0].message.content,
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      tokens: response.usage.total_tokens,
      cost: this.calculateCost('openai', response.usage.prompt_tokens, response.usage.completion_tokens)
    };
  }

  // Générer réponse mock intelligente
  generateMockResponse(message, context, responseType = 'health_coach') {
    const { userProfile, healthData, subscriptionLevel } = context;
    const userName = userProfile?.prenom || 'utilisateur';
    
    // Analyser le message pour détecter les intentions
    const intent = this.detectIntent(message);
    
    const mockResponses = {
      greeting: [
        `Salut ${userName} ! 👋 Je suis AVA, ton coach santé IA. Comment puis-je t'aider aujourd'hui ?`,
        `Bonjour ${userName} ! Prêt(e) à améliorer ta santé avec moi ? 🌟`,
        `Hello ${userName} ! Que veux-tu savoir sur ta santé et ton bien-être ?`
      ],
      
      health_status: [
        `D'après tes données récentes, tu sembles être sur la bonne voie ! ${this.generateHealthInsight(healthData)} Veux-tu des conseils spécifiques ?`,
        `Tes métriques de santé montrent des tendances intéressantes. ${this.generateHealthInsight(healthData)} Comment te sens-tu ?`,
        `Ton score de santé global est encouraging ! ${this.generateHealthInsight(healthData)}`
      ],
      
      nutrition: [
        `Pour ton objectif nutritionnel, je recommande de te concentrer sur les protéines et les légumes. Veux-tu un plan de repas personnalisé ?`,
        `Une alimentation équilibrée est clé pour tes objectifs. Avec ton abonnement ${subscriptionLevel}, je peux t'aider à optimiser tes repas !`,
        `Tes habitudes alimentaires ont un impact direct sur tes performances. Parlons de nutrition pratique !`
      ],
      
      fitness: [
        `Basé sur ton niveau d'activité, je suggère un programme progressif. Combien de temps peux-tu consacrer à l'exercice par semaine ?`,
        `Tes données d'activité montrent que tu es motivé(e) ! Optimisons ton entraînement ensemble 💪`,
        `Un bon équilibre cardio-musculation serait parfait pour toi. Veux-tu un programme personnalisé ?`
      ],
      
      sleep: [
        `Le sommeil est crucial pour ta récupération. ${this.generateSleepAdvice(healthData)} Veux-tu des conseils pour mieux dormir ?`,
        `Tes données de sommeil suggèrent quelques améliorations possibles. Parlons d'hygiène du sommeil !`,
        `Un sommeil de qualité boostera tes performances. Voici mes conseils pour cette nuit...`
      ],
      
      stress: [
        `La gestion du stress est importante pour ton bien-être. ${this.generateStressAdvice(healthData)} Essayons des techniques de relaxation ?`,
        `Je vois que tu pourrais bénéficier de techniques anti-stress. Veux-tu apprendre quelques exercices de respiration ?`,
        `Gérer le stress améliore tout le reste ! Parlons de techniques pratiques pour ton quotidien.`
      ],
      
      motivation: [
        `Tu es sur la bonne voie, ${userName} ! 🌟 Chaque petit pas compte. Quel est ton objectif principal aujourd'hui ?`,
        `Je crois en toi ! Tes efforts récents montrent ta détermination. Continue comme ça ! 💪`,
        `Rappelle-toi pourquoi tu as commencé. Tu as déjà fait tant de progrès ! Qu'est-ce qui te motive le plus ?`
      ],
      
      default: [
        `Intéressant ! En tant que ton coach santé, je pense que ${this.generateGenericAdvice(message, context)}. Veux-tu qu'on creuse ensemble ?`,
        `C'est une excellente question ! Avec tes données actuelles, je recommande ${this.generateGenericAdvice(message, context)}.`,
        `Laisse-moi t'aider avec ça ! Basé sur ton profil, ${this.generateGenericAdvice(message, context)}. Qu'en penses-tu ?`
      ]
    };

    const responses = mockResponses[intent] || mockResponses.default;
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      response: selectedResponse,
      provider: 'mock',
      model: 'ava-mock-v1',
      tokens: selectedResponse.length / 4, // Estimation
      cost: 0,
      confidence: 0.8,
      intent: intent,
      subscription_gated: subscriptionLevel === 'explore' && intent !== 'greeting'
    };
  }

  // Détecter l'intention du message
  detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    const intentKeywords = {
      greeting: ['bonjour', 'salut', 'hello', 'coucou', 'bonsoir'],
      health_status: ['comment', 'santé', 'forme', 'état', 'va', 'score'],
      nutrition: ['manger', 'repas', 'nutrition', 'aliment', 'régime', 'calories'],
      fitness: ['sport', 'exercice', 'musculation', 'cardio', 'entraînement', 'workout'],
      sleep: ['sommeil', 'dormir', 'fatigue', 'réveil', 'insomnie', 'repos'],
      stress: ['stress', 'anxiété', 'zen', 'relaxation', 'tension', 'calme'],
      motivation: ['motiver', 'encourager', 'objectif', 'but', 'réussir', 'continuer']
    };

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }

    return 'default';
  }

  // Construire le contexte personnalisé
  buildPersonalizedContext(context) {
    const { userProfile, healthData, subscriptionLevel } = context;
    
    let contextStr = `CONTEXTE UTILISATEUR:\n`;
    
    if (userProfile) {
      contextStr += `- Profil: ${userProfile.prenom || 'Utilisateur'}\n`;
      contextStr += `- Abonnement: ${subscriptionLevel}\n`;
      if (userProfile.preferences?.objectif) {
        contextStr += `- Objectif: ${userProfile.preferences.objectif}\n`;
      }
    }
    
    if (healthData) {
      contextStr += `- Données récentes:\n`;
      if (healthData.steps) contextStr += `  * Pas: ${healthData.steps}\n`;
      if (healthData.sleep) contextStr += `  * Sommeil: ${healthData.sleep}h\n`;
      if (healthData.stress) contextStr += `  * Stress: ${healthData.stress}/100\n`;
      if (healthData.energy) contextStr += `  * Énergie: ${healthData.energy}/100\n`;
    }

    return contextStr;
  }

  // Générer des insights de santé
  generateHealthInsight(healthData) {
    if (!healthData) return "Connecte tes données pour des conseils personnalisés !";
    
    const insights = [];
    
    if (healthData.steps) {
      if (healthData.steps >= 10000) {
        insights.push("Excellent pour les pas ! 🚶‍♀️");
      } else if (healthData.steps >= 7500) {
        insights.push("Bon niveau d'activité !");
      } else {
        insights.push("On peut augmenter l'activité quotidienne");
      }
    }
    
    if (healthData.sleep) {
      if (healthData.sleep >= 7) {
        insights.push("Sommeil dans la bonne moyenne ! 😴");
      } else {
        insights.push("Le sommeil pourrait être optimisé");
      }
    }
    
    return insights.length > 0 ? insights.join(' ') : "Tes données montrent du progrès !";
  }

  // Générer conseil sommeil
  generateSleepAdvice(healthData) {
    if (!healthData?.sleep) return "Connecte tes données de sommeil pour des conseils précis !";
    
    if (healthData.sleep < 6) {
      return "Tu manques de sommeil. Essaie de te coucher 30min plus tôt.";
    } else if (healthData.sleep > 9) {
      return "Tu dors beaucoup ! Vérifie la qualité de ton sommeil.";
    } else {
      return "Ta durée de sommeil est correcte ! Focus sur la qualité.";
    }
  }

  // Générer conseil stress
  generateStressAdvice(healthData) {
    if (!healthData?.stress) return "Active le monitoring de stress pour des conseils adaptés !";
    
    if (healthData.stress > 70) {
      return "Niveau de stress élevé détecté. Prends une pause !";
    } else if (healthData.stress > 50) {
      return "Stress modéré. Quelques exercices de respiration seraient bénéfiques.";
    } else {
      return "Ton stress semble bien géré ! Continue comme ça.";
    }
  }

  // Générer conseil générique
  generateGenericAdvice(message, context) {
    const advices = [
      "une approche progressive et personnalisée",
      "de commencer par de petits changements durables",
      "d'écouter ton corps et ajuster selon tes sensations",
      "de rester régulier dans tes efforts",
      "de célébrer chaque petit progrès"
    ];
    
    return advices[Math.floor(Math.random() * advices.length)];
  }

  // Sélectionner le provider optimal
  selectProvider(preferredProvider = null) {
    if (preferredProvider && this.isProviderAvailable(preferredProvider)) {
      return preferredProvider;
    }
    
    if (this.claudeEnabled) return 'claude';
    if (this.openaiEnabled) return 'openai';
    
    return 'mock';
  }

  // Vérifier disponibilité d'un provider
  isProviderAvailable(provider) {
    switch (provider) {
      case 'claude': return this.claudeEnabled;
      case 'openai': return this.openaiEnabled;
      default: return false;
    }
  }

  // Calculer le coût approximatif
  calculateCost(provider, inputTokens, outputTokens) {
    const costs = {
      openai: { input: 0.001, output: 0.002 }, // Par 1000 tokens
      claude: { input: 0.003, output: 0.015 }  // Par 1000 tokens
    };
    
    const providerCosts = costs[provider];
    if (!providerCosts) return 0;
    
    return ((inputTokens * providerCosts.input) + (outputTokens * providerCosts.output)) / 1000;
  }

  // Analyser les tendances de conversation
  async analyzeConversationTrends(userId, days = 30) {
    // TODO: Implémenter l'analyse des tendances de conversation
    // Analyser les sujets les plus discutés, l'évolution des questions, etc.
    
    return {
      topTopics: ['nutrition', 'fitness', 'sleep'],
      engagement: 'high',
      progressionNoted: true,
      suggestions: [
        'Continuer à poser des questions sur la nutrition',
        'Explorer les techniques de gestion du stress',
        'Planifier des objectifs fitness à long terme'
      ]
    };
  }
}

module.exports = new AIChatService();