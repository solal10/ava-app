# Garmin OAuth 2.0 + PKCE - Guide d'Intégration

## ⚠️ CONTRAINTES CRITIQUES

### Redirect URI Console Garmin
**OBLIGATOIRE**: La console développeur Garmin doit être configurée avec EXACTEMENT:
```
https://lazy-swan-100.loca.lt/auth/garmin/rappel
```

⚠️ **Attention**: Aucun caractère supplémentaire, espace, ou variation n'est autorisé. L'URL doit correspondre EXACTEMENT.

### Limitation CORS Garmin
**CRITIQUE**: Garmin Connect **NE SUPPORTE PAS** les requêtes CORS preflight (OPTIONS).

```javascript
// ❌ INTERDIT - Échec CORS garanti
fetch('https://diauth.garmin.com/di-oauth2-service/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' } // Déclenche OPTIONS preflight
});

// ✅ OBLIGATOIRE - Échange côté serveur Node.js uniquement
```

**Architecture imposée:**
```
Frontend → Backend Node.js → Garmin API
    ↑           ↓
    ←───────────┘
```

## 🔧 Configuration Verrouillée

### Contexte Immuable
```javascript
const GARMIN_CONFIG = {
  CLIENT_ID: '9efacb80-abc5-41f3-8a01-207f9197aaaf',
  REDIRECT_URI: 'https://lazy-swan-100.loca.lt/auth/garmin/rappel',
  AUTHORIZATION_URL: 'https://connect.garmin.com/oauth2Confirm',
  TOKEN_URL: 'https://diauth.garmin.com/di-oauth2-service/oauth/token'
};
```

### Variables d'Environnement
```bash
# .env
GARMIN_CLIENT_SECRET=As/Aomzxc2dm+Nwq83elmAHa/uOFmfbxP6TVsOz4LzI
```

## 🚀 Endpoints Implémentés

### GET /auth/garmin/login
**Fonction**: Génère URL d'autorisation avec PKCE S256
**Comportement**:
- Génère `code_verifier` (43-128 caractères base64url)
- Génère `code_challenge` (SHA256 + base64url du verifier)
- Stocke `{state, verifier, createdAt}` côté serveur
- Redirection 302 vers Garmin OAuth

**Logging avec ID corrélation:**
```
[a1b2c3d4] 🔗 GET /auth/garmin/login - Génération PKCE
[a1b2c3d4] 📏 code_verifier length: 43 (dGVzdC12ZXJp...)
[a1b2c3d4] 🎯 STEP 1 - redirect_uri utilisé: https://lazy-swan-100.loca.lt/auth/garmin/rappel
```

### GET /auth/garmin/rappel
**Fonction**: Callback avec garde anti-double usage
**Protections**:
- Vérification immédiate si code déjà utilisé → status `duplicate`
- Marquage code comme utilisé AVANT échange token
- Validation state (expiration 15 minutes)
- Échange token UNE SEULE FOIS, AUCUN retry

**Logging avec assertions:**
```
[a1b2c3d4] 🔄 GET /auth/garmin/rappel
[a1b2c3d4] 🔒 Code marqué comme utilisé (TTL 15min)
[a1b2c3d4] 🎯 STEP 2 - redirect_uri utilisé: https://lazy-swan-100.loca.lt/auth/garmin/rappel
[a1b2c3d4] 🔍 ASSERTION - redirect_uri STEP1 === STEP2: true
```

## 🛡️ Protection Anti-Double Usage

### Garde Idempotence
```javascript
// Vérification IMMÉDIATE
if (this.usedCodes.has(code)) {
  console.log(`[${correlationId}] 🚫 DUPLICATE - Code déjà utilisé`);
  return res.redirect('/auth/garmin/done?status=duplicate&reason=code_already_used');
}

// Marquage AVANT traitement
this.usedCodes.add(code);
```

### Statuts de Redirection
- `status=ok` - Token obtenu avec succès
- `status=duplicate` - Code déjà utilisé (protection idempotence)
- `status=rate_limited` - HTTP 429 de Garmin
- `status=error` - Autres erreurs (state invalide, network, etc.)

## 🧪 Tests de Validation

### Test Unitaire Anti-Double Usage
```bash
npm test tests/garmin-oauth-double-usage.test.js
```

**Scénarios testés:**
1. Premier appel callback → succès
2. Deuxième appel même code → `status=duplicate`
3. Race condition → un succès, un duplicate
4. Échec token → pas de retry possible

### Test Manuel Complet
```bash
# 1. Démarrer tunnel
npx localtunnel --port 5003 --subdomain lazy-swan-100

# 2. Démarrer backend
node server.js

# 3. Test URL génération
curl http://localhost:5003/auth/garmin/login

# 4. Test callback invalide
curl "http://localhost:5003/auth/garmin/rappel?code=invalid&state=invalid"
```

## 🌐 Frontend React/Next

### Bouton avec Protection Anti-Double Clic
```jsx
const connectGarmin = async () => {
  // PROTECTION ANTI-DOUBLE CLIC
  if (garminStatus.loading) {
    console.log('🚫 Connexion déjà en cours - IGNORE');
    return;
  }
  
  // Désactiver bouton IMMÉDIATEMENT
  setGarminStatus(prev => ({ ...prev, loading: true }));
  
  // Redirection directe (pas d'AJAX)
  window.location.href = '/auth/garmin/login';
};

// Bouton avec état disabled
<button 
  onClick={connectGarmin}
  disabled={garminStatus.loading}
  className={garminStatus.loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500'}
>
  {garminStatus.loading ? 'Connexion en cours...' : 'Se connecter avec Garmin'}
</button>
```

## 📊 Flux Complet Testé

```
1. User: Clic "Se connecter avec Garmin"
2. Frontend: window.location.href = '/auth/garmin/login'
3. Backend: Génération PKCE + redirection 302 vers Garmin
4. Garmin: Authentification utilisateur
5. Garmin: Callback → /auth/garmin/rappel?code=...&state=...
6. Backend: Validation state + garde anti-double usage
7. Backend: POST token exchange (côté serveur uniquement)
8. Backend: Redirection → /auth/garmin/done?status=ok
9. Frontend: Page de succès → retour dashboard
```

## 🔍 Debugging et Logs

### Format de Log Standardisé
```
[correlationId] 🔗 Action - Description
[correlationId] 📤 POST https://diauth.garmin.com/di-oauth2-service/oauth/token
[correlationId] 📥 HTTP 200 OK
[correlationId] ✅ TOKEN OBTENU: access_token: eyJhbGc...
[correlationId] ❌ ÉCHEC ÉCHANGE TOKEN: Status: 429, Body: Rate limit exceeded
```

### Surveillance Critique
- **redirect_uri STEP1 === STEP2**: Doit être identique
- **Code marqué comme utilisé**: Avant tout traitement
- **Aucun retry**: Après échec, code inutilisable
- **Un seul POST /oauth/token**: Par code d'autorisation

## 🚨 Résolution Problèmes

### Erreur 429 (Rate Limited)
**Cause**: Réutilisation de code d'autorisation
**Solution**: Protection anti-double usage implémentée
**Vérification**: Logs `🚫 DUPLICATE - Code déjà utilisé`

### Boucle de Login
**Cause**: Callback non traité ou redirect_uri incorrect
**Solution**: Vérifier console Garmin + logs ASSERTION

### CORS Error Frontend
**Cause**: Tentative d'échange token côté navigateur
**Solution**: Architecture serveur-only obligatoire

## ✅ Checklist Déploiement

- [ ] Console Garmin: `https://lazy-swan-100.loca.lt/auth/garmin/rappel`
- [ ] Tunnel localtunnel actif sur `lazy-swan-100`
- [ ] Variable `GARMIN_CLIENT_SECRET` configurée
- [ ] Tests anti-double usage passent
- [ ] Logs avec ID corrélation fonctionnels
- [ ] Frontend bouton avec protection anti-double clic
- [ ] Page `/auth/garmin/done` pour gestion retours

L'intégration est maintenant **verrouillée et sécurisée** contre tous les cas d'usage problématiques identifiés.
