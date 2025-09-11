# Configuration de l'IA - AVA Coach Santé

## ✅ État de l'Intégration

L'intégration AI est **COMPLÈTE** avec support pour :
- **OpenAI GPT-3.5/4** - Chat intelligent avec historique
- **Anthropic Claude 3 Sonnet** - Réponses expertes en santé 
- **Mode Mock Intelligent** - Fallback réaliste si pas d'API
- **Test de Connexions** - Diagnostic des API en temps réel

## 🔧 Configuration des API

### 1. OpenAI Configuration
```bash
# Dans backend/.env
OPENAI_API_KEY=sk-your-real-openai-api-key-here
DEFAULT_AI_PROVIDER=openai
```

### 2. Anthropic Claude Configuration  
```bash
# Dans backend/.env
ANTHROPIC_API_KEY=sk-ant-your-real-anthropic-api-key-here
DEFAULT_AI_PROVIDER=claude
```

### 3. Variables Complètes
```bash
# Configuration IA
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
DEFAULT_AI_PROVIDER=openai  # ou 'claude'
```

## 🚀 Fonctionnalités Disponibles

### API Endpoints
| Route | Méthode | Description | Authentification |
|-------|---------|-------------|------------------|
| `/api/ia/ask` | POST | Poser une question au coach IA | ✅ |
| `/api/ia/history` | GET | Récupérer l'historique de conversation | ✅ |
| `/api/ia/analytics` | GET | Analytics des conversations (Pro/Elite) | ✅ |
| `/api/ia/feedback` | POST | Donner un feedback sur une réponse | ✅ |
| `/api/ia/usage-limits` | GET | Voir les limites d'utilisation | ✅ |
| `/api/ia/status` | GET | Statut du service IA | ✅ |
| `/api/ia/test-api` | POST | Test des connexions API (Elite) | ✅ |

### Gestion des Abonnements
- **Explore**: 3 questions/semaine, 150 tokens max
- **Perform**: Illimité, 300 tokens max
- **Pro**: Illimité, 500 tokens max, analytics
- **Elite**: Illimité, 800 tokens max, analytics + test API

## 🧠 Intelligence du Système

### Détection d'Intention
Le système détecte automatiquement le type de question :
- `greeting` - Salutations
- `health_status` - Questions sur l'état de santé
- `nutrition` - Conseils alimentaires 
- `fitness` - Exercices et sport
- `sleep` - Sommeil et récupération
- `stress` - Gestion du stress
- `motivation` - Encouragement

### Contexte Personnalisé
Chaque réponse utilise :
- **Profil utilisateur** (nom, objectifs, préférences)
- **Données de santé** récentes (pas, sommeil, stress)
- **Historique de conversation** (10 derniers échanges)
- **Niveau d'abonnement** (fonctionnalités adaptées)

## 🔄 Mode de Fonctionnement

### 1. Avec API Configurées
```javascript
// Le système utilise automatiquement l'API configurée
const response = await aiService.generateResponse("Comment améliorer mon sommeil?", {
  userId: "user123",
  subscriptionLevel: "pro",
  healthData: { sleep: 6.5, stress: 45 }
});
```

### 2. Mode Mock (Fallback)
```javascript
// Si pas d'API, utilise des réponses intelligentes pré-définies
const response = {
  response: "Basé sur tes 6.5h de sommeil, je recommande...",
  provider: "mock",
  confidence: 0.8
};
```

## 📊 Monitoring et Tests

### Test des Connexions (Elite uniquement)
```bash
curl -X POST http://localhost:5003/api/ia/test-api \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Statut du Service
```bash
curl -X GET http://localhost:5003/api/ia/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Avantages de l'Implémentation

- ✅ **Fallback Intelligent** - Fonctionne avec ou sans API
- ✅ **Multi-Provider** - OpenAI + Claude pour redondance
- ✅ **Personnalisation** - Contexte utilisateur intégré
- ✅ **Gestion des Limites** - Par niveau d'abonnement
- ✅ **Monitoring** - Tests de santé des API
- ✅ **Sécurité** - Authentication sur toutes les routes

## 🔐 Sécurité

- Les clés API sont stockées en variables d'environnement
- Authentification JWT requise sur toutes les routes
- Gestion des quotas par niveau d'abonnement  
- Logs de sécurité pour toutes les requêtes
- Test des connexions réservé aux utilisateurs Elite

---

**Status**: ✅ **INTÉGRATION COMPLÈTE** - Prêt pour la production avec vraies API keys