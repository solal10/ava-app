#!/bin/bash

# Script de démarrage stable pour l'application Coach Santé
echo "🚀 Démarrage de l'application Coach Santé..."

# Arrêter tous les processus existants
echo "🛑 Arrêt des processus existants..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Vérifier que MongoDB est démarré
echo "🗄️ Vérification de MongoDB..."
if ! brew services list | grep mongodb-community | grep started > /dev/null; then
    echo "📦 Démarrage de MongoDB..."
    brew services start mongodb/brew/mongodb-community
    sleep 3
fi

# Démarrer le backend
echo "🖥️ Démarrage du backend..."
node server.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
sleep 5

# Vérifier que le backend répond
for i in {1..10}; do
    if curl -s http://localhost:5003/ > /dev/null; then
        echo "✅ Backend opérationnel sur le port 5003"
        break
    fi
    echo "⏳ Tentative $i/10..."
    sleep 2
done

# Démarrer le frontend
echo "🌐 Démarrage du frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Attendre que le frontend soit prêt
echo "⏳ Attente du frontend..."
sleep 5

# Vérifier que le frontend répond
for i in {1..10}; do
    if curl -s http://localhost:5173/ > /dev/null; then
        echo "✅ Frontend opérationnel sur le port 5173"
        break
    fi
    echo "⏳ Tentative $i/10..."
    sleep 2
done

echo ""
echo "🎉 Application Coach Santé démarrée avec succès !"
echo "📱 Frontend: http://localhost:5173/"
echo "🖥️ Backend: http://localhost:5003/"
echo ""
echo "Pour arrêter l'application, utilisez: ./stop-app.sh"
echo "PIDs sauvegardés dans .app-pids"

# Sauvegarder les PIDs pour pouvoir arrêter proprement
echo "$BACKEND_PID" > .app-pids
echo "$FRONTEND_PID" >> .app-pids

# Garder le script actif
wait
