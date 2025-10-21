# 🎯 OPAC : Organisez, Priorisez, Avancez, Concentrez-vous

## Votre système Kanban personnel, simple et puissant

**OPAC** est une application de gestion de tâches moderne qui vous redonne le contrôle. 
Pensée comme une alternative locale à Trello, elle combine simplicité d'utilisation 
et respect de votre vie privée.

### ✨ L'essentiel en un coup d'œil

- **🔒 100% Local** : Vos données restent sur votre machine
- **⚡ Léger & Rapide** : Interface minimaliste, aucun temps de chargement
- **🎯 Multi-vues** : Kanban, Timeline ou vue globale
- **📁 Projets illimités** : Séparez travail, personnel et side-projects
- **🎨 Drag & Drop** : Organisez vos tâches naturellement

### 💡 La philosophie

Pas de complexité inutile. Pas de cloud. Pas d'abonnement.  
Juste un tableau Kanban efficace qui vous aide à **avancer** sur ce qui compte.

**À faire → En cours → Terminé**  
C'est tout ce dont vous avez besoin.


### ✅ OS compatibles avec OPAC

| Compatibilité | OS |	Version minimale |
|---------------|----|------------------|
| 🪟 | Windows | 10+|
| 🍎 | macOS 	| 10.15+ (Catalina) |
| 🐧 | Linux 	| Ubuntu 18.04+, Debian 10+ | 

## 🚀 Démarrer avec OPAC
### Installation des technologies
```
npm install electron sqlite3
```

### Développement
```
npm run dev
```

### Build production
```
npm run build
```

### Packages
```
npm run package:win   # Windows
npm run package:mac   # macOS
npm run package:linux # Linux
```


## 🛠️ Technologies utilisées

### Stack technique

OPAC repose sur un ensemble de technologies modernes, légères et performantes :

#### 🖥️ **Electron**
Framework pour créer des applications desktop cross-platform avec les technologies web.

- **Version** : ^38.2.2
- **Pourquoi Electron ?**
  - Développement rapide avec HTML/CSS/JS
  - Une seule codebase pour Windows, macOS et Linux
  - Écosystème npm riche
  - Interface native OS (menus, notifications, fichiers)

#### 🗄️ **SQLite via better-sqlite3**
Base de données SQL légère et embarquée.

- **Version** : ^12.4.1
- **Pourquoi SQLite ?**
  - ✅ Zéro configuration : pas de serveur à installer
  - ✅ Fichier unique `.db` facilement sauvegardable
  - ✅ Performances locales exceptionnelles (< 5ms par requête)
  - ✅ ACID compliant : transactions fiables
  - ✅ Parfait pour une application monoposte

#### 🎨 **Vanilla JavaScript**
Pas de framework front-end (React, Vue, Angular).

- **Pourquoi vanilla ?**
  - ⚡ Démarrage instantané (pas de compilation)
  - 📦 Application plus légère (~50 MB vs 150+ MB)
  - 🎯 Simplicité : pas de concepts complexes à maîtriser
  - 🔧 Contrôle total sur le DOM

#### 🎭 **CSS natif**
Aucun framework CSS (Bootstrap, Tailwind).

- **Pourquoi CSS pur ?**
  - Flexbox/Grid natifs suffisent pour nos besoins
  - Variables CSS pour le thème
  - Pas de surcharge de classes inutilisées
  - Facilité de personnalisation totale

### Architecture de l'application

![](/Users/Amaury/Library/Application Support/CleanShot/media/media_sfJfSfQUbV/CleanShot 2025-10-19 at 13.23.08@2x.png)


### Sécurité

- **Context isolation** : Séparation stricte entre renderer et main process
- **Preload script** : API contrôlée exposée au front-end
- **Pas de `nodeIntegration`** : Empêche l'exécution de code Node.js arbitraire
- **SQL préparé** : Protection contre les injections SQL

### Dépendances de développement

```
{
  "electron": "^38.2.2",
  "better-sqlite3": "^12.4.1"
} 
```	

## 🗄️ Architecture de la base de données

#### Table `tasks`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Identifiant unique auto-incrémenté |
| `title` | TEXT NOT NULL | Titre de la tâche |
| `description` | TEXT | Description détaillée (optionnelle) |
| `deadline` | DATETIME | Date et heure d'échéance |
| `status` | TEXT NOT NULL | Statut actuel : `todo`, `inprogress`, `done` |
| `responsible` | TEXT | Responsable assigné *(non implémenté)* |
| `load` | INTEGER | Charge de travail estimée *(non implémenté)* |
| `project_id` | INTEGER | Clé étrangère vers `projects.id` |
| `creation_date` | DATETIME NOT NULL | Date de création |
| `last_update_date` | DATETIME | Dernière modification |
| `last_status_change_date` | DATETIME | Dernière transition de statut |


#### Table `projects`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Identifiant unique auto-incrémenté |
| `name` | TEXT NOT NULL | Nom du projet |
| `description` | TEXT | Description du projet |
| `creation_date` | DATETIME NOT NULL | Date de création |
| `last_update_date` | DATETIME | Dernière modification du projet |
| `last_progress_date` | DATETIME | Dernière transition de statut d'une tâche |


## 🏗️ Améliorations futures

+ `responsible` : Gestion des assignations
+ `load` : Estimation de charge (en heures)
+ Vue charge de travail : Graphiques de capacité
+ Récurrence : Tâches répétitives
+ Export/Import : JSON, CSV
