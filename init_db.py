"""
Script d'initialisation de la base de données OPAC
Crée la base et les tables si elles n'existent pas
"""

import sqlite3
import os

# Chemin vers la base de données
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'tasks.db')

def init_database():
    """Créer la base et les tables si elles n'existent pas"""
    
    # Créer le dossier database s'il n'existe pas
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    # Connexion (crée le fichier si inexistant)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table PROJECTS
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_update_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_progress_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table TASKS
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            deadline DATETIME,
            status TEXT NOT NULL DEFAULT 'todo',
            load REAL DEFAULT 0.0,
            responsible TEXT,
            priority TEXT DEFAULT 'haute',
            project_id INTEGER,
            creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_update_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_status_change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    ''')
    
    # Index pour améliorer les performances
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_tasks_project_id 
        ON tasks(project_id)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_tasks_status 
        ON tasks(status)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_tasks_priority 
        ON tasks(priority)
    ''')
    
    conn.commit()
    conn.close()
    
    print(f"✅ Base de données initialisée: {DB_PATH}")
    print(f"📊 Taille du fichier: {os.path.getsize(DB_PATH) / 1024:.2f} Ko")

if __name__ == '__main__':
    init_database()
