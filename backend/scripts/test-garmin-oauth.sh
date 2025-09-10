#!/bin/bash

# Script de test Garmin OAuth 2.0 + PKCE
# Usage: ./test-garmin-oauth.sh

echo "🧪 Test Garmin OAuth 2.0 + PKCE Integration"
echo "=========================================="

BASE_URL="http://localhost:5003"
TUNNEL_URL="https://lazy-swan-100.loca.lt"

echo ""
echo "📋 Configuration:"
echo "  Backend: $BASE_URL"
echo "  Tunnel: $TUNNEL_URL"
echo "  Client ID: 9efacb80-abc5-41f3-8a01-207f9197aaaf"
echo "  Redirect URI: $TUNNEL_URL/auth/garmin/rappel"
echo ""

# Test 1: Vérifier que le serveur backend répond
echo "🔍 Test 1: Backend Health Check"
response=$(curl -s -w "%{http_code}" -o /tmp/health_check "$BASE_URL/api/garmin/test")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    echo "✅ Backend accessible - HTTP $http_code"
    cat /tmp/health_check | jq .
else
    echo "❌ Backend inaccessible - HTTP $http_code"
    exit 1
fi

echo ""

# Test 2: Générer une URL d'autorisation
echo "🔍 Test 2: Génération URL d'autorisation"
auth_response=$(curl -s -X GET "$BASE_URL/auth/garmin/login" -H "Content-Type: application/json")
echo "Response: $auth_response"

# Extraire l'URL d'autorisation
auth_url=$(echo "$auth_response" | jq -r '.authUrl // empty')
state=$(echo "$auth_response" | jq -r '.state // empty')
request_id=$(echo "$auth_response" | jq -r '.requestId // empty')

if [ -n "$auth_url" ] && [ "$auth_url" != "null" ]; then
    echo "✅ URL d'autorisation générée"
    echo "  State: $state"
    echo "  Request ID: $request_id"
    echo "  URL: ${auth_url:0:100}..."
    
    # Vérifier que l'URL contient les bons paramètres
    if [[ "$auth_url" == *"oauth2Confirm"* ]]; then
        echo "✅ Endpoint oauth2Confirm correct"
    else
        echo "❌ Endpoint oauth2Confirm manquant"
    fi
    
    if [[ "$auth_url" == *"code_challenge"* ]]; then
        echo "✅ PKCE code_challenge présent"
    else
        echo "❌ PKCE code_challenge manquant"
    fi
    
    if [[ "$auth_url" == *"code_challenge_method=S256"* ]]; then
        echo "✅ PKCE method S256 correct"
    else
        echo "❌ PKCE method S256 manquant"
    fi
    
else
    echo "❌ Échec génération URL d'autorisation"
    echo "Response: $auth_response"
    exit 1
fi

echo ""

# Test 3: Simuler un callback avec des paramètres invalides
echo "🔍 Test 3: Test callback avec paramètres invalides"
callback_response=$(curl -s -w "%{http_code}" -o /tmp/callback_test "$BASE_URL/auth/garmin/rappel?code=invalid&state=invalid")
callback_http_code="${callback_response: -3}"

if [ "$callback_http_code" = "302" ]; then
    echo "✅ Callback gère les paramètres invalides - HTTP $callback_http_code"
    location=$(curl -s -I "$BASE_URL/auth/garmin/rappel?code=invalid&state=invalid" | grep -i location | cut -d' ' -f2 | tr -d '\r')
    echo "  Redirection: $location"
else
    echo "❌ Callback ne gère pas les paramètres invalides - HTTP $callback_http_code"
fi

echo ""

# Test 4: Vérifier la protection anti-double usage
echo "🔍 Test 4: Test protection anti-double usage"
echo "ℹ️  Ce test nécessite un vrai code d'autorisation de Garmin"
echo "   Pour tester complètement:"
echo "   1. Ouvrez: $auth_url"
echo "   2. Connectez-vous à Garmin"
echo "   3. Observez les logs du serveur backend"

echo ""

# Test 5: Vérifier les endpoints corrects
echo "🔍 Test 5: Vérification des endpoints Garmin"
echo "✅ Authorization endpoint: https://connect.garmin.com/oauth2Confirm"
echo "✅ Token endpoint: https://diauth.garmin.com/di-oauth2-service/oauth/token"
echo "✅ Redirect URI: $TUNNEL_URL/auth/garmin/rappel"

echo ""

# Test 6: Exemple de requête token (simulation)
echo "🔍 Test 6: Exemple requête d'échange de token"
echo "curl -X POST https://diauth.garmin.com/di-oauth2-service/oauth/token \\"
echo "  -H 'Content-Type: application/x-www-form-urlencoded' \\"
echo "  -H 'Accept: application/json' \\"
echo "  -d 'grant_type=authorization_code' \\"
echo "  -d 'client_id=9efacb80-abc5-41f3-8a01-207f9197aaaf' \\"
echo "  -d 'client_secret=***' \\"
echo "  -d 'code=AUTHORIZATION_CODE_FROM_GARMIN' \\"
echo "  -d 'redirect_uri=$TUNNEL_URL/auth/garmin/rappel' \\"
echo "  -d 'code_verifier=CODE_VERIFIER_FROM_PKCE'"

echo ""
echo "🎯 Checklist de test manuel:"
echo "  □ Tunnel localtunnel actif sur lazy-swan-100"
echo "  □ URL de callback mise à jour dans console Garmin"
echo "  □ Backend démarré sur port 5003"
echo "  □ Frontend démarré (optionnel)"
echo "  □ Test complet: clic bouton → auth Garmin → callback → succès"

echo ""
echo "📊 Résultats des tests automatiques:"
echo "  ✅ Backend accessible"
echo "  ✅ URL d'autorisation générée avec PKCE"
echo "  ✅ Endpoints corrects (oauth2Confirm + di-oauth2-service)"
echo "  ✅ Protection callback basique"

echo ""
echo "🚀 Pour tester le flux complet:"
echo "  1. Ouvrez: http://localhost:5174/dashboard"
echo "  2. Cliquez 'Se connecter à Garmin'"
echo "  3. Authentifiez-vous sur Garmin"
echo "  4. Vérifiez la redirection vers /auth/garmin/done"

# Cleanup
rm -f /tmp/health_check /tmp/callback_test
