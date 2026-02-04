# eroz
PFE - Éroz est une plateforme pédagogique interactive permettant aux étudiants de s’entraîner à l’analyse d’images médicales grâce à une interface moderne et un système de scoring assisté par intelligence artificielle.

## Installation et Lancement

Le projet est composé d'un frontend (React/Vite) et d'un backend (Node/Express). Il faut lancer les deux pour que l'application fonctionne correctement.

### 1. Backend (Serveur & Base de données)
Ouvrez un terminal et exécutez :
```bash
cd backend
npm install
npx prisma migrate dev  # Pour initialiser la base de données
node seed.js            # (Optionnel) Pour créer l'utilisateur Admin par défaut
npm run dev
```
Le serveur démarrera sur `http://localhost:3000`.

### 2. Frontend (Interface Utilisateur)
Ouvrez un **deuxième terminal** (à la racine du projet) et exécutez :
```bash
npm install
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

## Comptes de test
- **Admin**: `admin@eroz.com` / `admin123`
- **Étudiant**: Créez un compte via la page d'inscription.
