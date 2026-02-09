# 🚀 GUIDE DE LANCEMENT DU PROJET ÉROZ

Ce fichier vous explique comment lancer le projet complet (Backend + Frontend) sur votre machine locale.

## 📋 Prérequis
- Avoir **Node.js** installé sur votre machine.

---

## 1️⃣ Lancer le Backend (Serveur)

1. Ouvrez un terminal.
2. Déplacez-vous dans le dossier `backend` :
   ```bash
   cd backend
   ```
3. Installez les dépendances (si ce n'est pas déjà fait) :
   ```bash
   npm install
   ```
4. Lancez le serveur :
   ```bash
   npm run dev
   ```
   > Le serveur démarrera sur **http://localhost:3000**

---

## 2️⃣ Lancer le Frontend (Site Web)

1. Ouvrez un **nouveau** terminal (gardez le premier ouvert).
2. Assurez-vous d'être à la racine du projet (`eroz`).
3. Installez les dépendances (si ce n'est pas déjà fait) :
   ```bash
   npm install
   ```
4. Lancez le site :
   ```bash
   npm run dev
   ```
   > Le site sera accessible sur **http://localhost:5173**

---

## 🔑 Identifiants Administrateur

Pour accéder à toutes les fonctionnalités (Gestion utilisateurs, Création d'entraînements, etc.), connectez-vous avec ce compte :

- **URL** : http://localhost:5173/login
- **Email** : `admin@eroz.com`
- **Mot de passe** : `admin123`
