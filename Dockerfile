# ================================
# Dockerfile - Éroz Frontend
# Multi-stage build: Node + Nginx
# ================================

# ---------------------------------
# STAGE 1: Build de l'application
# ---------------------------------
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --silent

# Copier le code source
COPY . .

# Build de production
RUN npm run build

# ---------------------------------
# STAGE 2: Serveur Nginx
# ---------------------------------
FROM nginx:alpine AS production

# Copier la configuration Nginx personnalisée
RUN rm /etc/nginx/conf.d/default.conf

# Créer une configuration optimisée pour SPA React
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Gzip compression \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    gzip_min_length 1000; \
    \
    # Cache des assets statiques \
    location /assets/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Fallback pour le routing SPA \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Headers de sécurité \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
}' > /etc/nginx/conf.d/default.conf

# Copier le build depuis le stage précédent
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
