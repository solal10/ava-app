# 🚀 Guide de Déploiement - AVA MVP

## 📋 Prérequis Production

### Serveur
- **OS** : Ubuntu 20.04+ ou CentOS 8+
- **RAM** : 2GB minimum, 4GB recommandé
- **CPU** : 2 cores minimum
- **Stockage** : 20GB minimum
- **Node.js** : Version 18+ LTS
- **MongoDB** : Version 5.0+

### Services Cloud Recommandés
- **VPS** : DigitalOcean, AWS EC2, Google Cloud
- **Base de données** : MongoDB Atlas (gratuit jusqu'à 512MB)
- **CDN** : Cloudflare (gratuit)
- **Monitoring** : Uptime Robot (gratuit)

## 🛠 Installation Production

### 1. Préparation du Serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation PM2 (gestionnaire de processus)
sudo npm install -g pm2

# Installation de MongoDB (optionnel si vous utilisez MongoDB Atlas)
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Installation Nginx (reverse proxy)
sudo apt install -y nginx
```

### 2. Déploiement de l'Application

```bash
# Cloner le projet
git clone <votre-repo> /var/www/ava-app
cd /var/www/ava-app

# Installation des dépendances
npm run install:all

# Configuration environnement
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Éditer les fichiers .env avec vos valeurs de production
nano backend/.env
```

### 3. Configuration Variables d'Environnement

**backend/.env** :
```env
NODE_ENV=production
PORT=5003
MONGODB_URI=mongodb://localhost:27017/ava-app-prod
# Ou pour MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ava-app

JWT_SECRET=votre-secret-jwt-super-securise-en-production
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://votre-domaine.com

# Spoonacular API (optionnel)
SPOONACULAR_API_KEY=votre_cle_api

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**frontend/.env** :
```env
VITE_API_URL=https://votre-domaine.com
VITE_APP_NAME=AVA Coach Santé IA
VITE_APP_VERSION=1.0.0

# Features flags pour la production
VITE_FEATURE_GARMIN_INTEGRATION=false
VITE_FEATURE_AI_FOOD_RECOGNITION=false
VITE_FEATURE_ADVANCED_ANALYTICS=false
```

### 4. Build et Déploiement

```bash
# Build du frontend
npm run build:frontend

# Démarrage avec PM2
cd backend
pm2 start server.js --name "ava-backend" --env production

# Vérifier le statut
pm2 status
pm2 logs ava-backend

# Configuration PM2 pour redémarrage automatique
pm2 startup
pm2 save
```

### 5. Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/ava-app
```

Contenu du fichier :
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Redirection HTTPS (après configuration SSL)
    # return 301 https://$server_name$request_uri;

    # Frontend - fichiers statiques
    location / {
        root /var/www/ava-app/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Headers de sécurité
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Activation de la configuration :
```bash
sudo ln -s /etc/nginx/sites-available/ava-app /etc/nginx/sites-enabled/
sudo nginx -t  # Tester la configuration
sudo systemctl restart nginx
```

## 🔒 SSL/HTTPS avec Let's Encrypt

```bash
# Installation Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtention du certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Test du renouvellement automatique
sudo certbot renew --dry-run

# Le renouvellement automatique est configuré via cron
```

## 📊 Monitoring et Logs

### 1. Monitoring PM2

```bash
# Installation PM2 Monitoring (optionnel)
pm2 install pm2-server-monit

# Logs en temps réel
pm2 logs

# Monitoring des ressources
pm2 monit
```

### 2. Logs Nginx

```bash
# Logs d'accès
sudo tail -f /var/log/nginx/access.log

# Logs d'erreur
sudo tail -f /var/log/nginx/error.log
```

### 3. Monitoring Application

```bash
# Statut des services
sudo systemctl status nginx
sudo systemctl status mongod
pm2 status

# Espace disque
df -h

# Mémoire et CPU
htop
```

## 🔄 Mises à Jour

### Script de Déploiement

Créer `/var/www/ava-app/deploy.sh` :
```bash
#!/bin/bash

# Arrêter l'application
pm2 stop ava-backend

# Mise à jour du code
git pull origin main

# Installation des nouvelles dépendances
npm run install:all

# Build du frontend
npm run build:frontend

# Restart de l'application
pm2 restart ava-backend

# Vérification
sleep 5
pm2 status
```

Utilisation :
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🚨 Troubleshooting Production

### 1. Application ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs ava-backend

# Vérifier les variables d'environnement
pm2 env ava-backend

# Test manuel
cd backend && node server.js
```

### 2. Problèmes de base de données

```bash
# Vérifier MongoDB
sudo systemctl status mongod
mongo --eval "db.runCommand('connectionStatus')"

# Vérifier la connectivité avec MongoDB Atlas
nslookup cluster.mongodb.net
```

### 3. Problèmes Nginx

```bash
# Vérifier la configuration
sudo nginx -t

# Recharger la configuration
sudo systemctl reload nginx

# Vérifier les ports
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

## 📈 Optimisations Performance

### 1. Compression Nginx

Déjà incluse dans la configuration Nginx ci-dessus.

### 2. Cache Browser

```nginx
# Dans le serveur Nginx, ajouter :
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}
```

### 3. Optimisation MongoDB

```javascript
// Indexer les champs recherchés fréquemment
db.users.createIndex({ "email": 1 })
db.health.createIndex({ "userId": 1, "createdAt": -1 })
```

## 🔐 Sécurité Production

### 1. Firewall

```bash
# Installation UFW
sudo ufw enable

# Ouvrir les ports nécessaires
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Bloquer l'accès direct au port backend
sudo ufw deny 5003
```

### 2. Fail2ban (Protection contre brute force)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### 3. Mises à jour automatiques

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

---

## ✅ Checklist Pré-Déploiement

- [ ] Variables d'environnement configurées
- [ ] SSL/HTTPS activé
- [ ] Firewall configuré
- [ ] Monitoring en place
- [ ] Sauvegardes configurées
- [ ] Tests de charge effectués
- [ ] Documentation mise à jour
- [ ] Scripts de déploiement testés

---

**Temps estimé de déploiement** : 2-3 heures pour un déploiement complet
**Maintenance** : 1-2 heures par mois