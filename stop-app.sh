#!/bin/bash

# Script d'arrêt pour l'application Coach Santé
echo "🛑 Arrêt de l'application Coach Santé..."

# Lire les PIDs sauvegardés
if [ -f .app-pids ]; then
    echo "📋 Lecture des PIDs sauvegardés..."
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "🔪 Arrêt du processus $pid"
            kill $pid
        fi
    done < .app-pids
    rm .app-pids
fi

# Arrêter tous les processus liés
echo "🧹 Nettoyage des processus..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "✅ Application arrêtée avec succès !"
