# FlaskEnv
# source FlaskEnv/bin/activate 
import os
import sys
from flask import Flask, jsonify, request, render_template
import sqlite3

app = Flask(__name__)

# ⭐ GESTION DES CHEMINS POUR PYINSTALLER
def get_base_path():
    """Retourne le chemin de base (dev ou compilé)"""
    if getattr(sys, 'frozen', False):
        # Mode compilé : PyInstaller extrait les fichiers dans un dossier temporaire
        return sys._MEIPASS
    else:
        # Mode développement
        return os.path.dirname(os.path.abspath(__file__))

def get_db_path():
    """Retourne le chemin vers la base de données"""
    if getattr(sys, 'frozen', False):
        # En mode compilé, stocker la DB dans le dossier utilisateur
        # (le dossier temporaire de PyInstaller est en lecture seule)
        user_data_dir = os.path.expanduser('~/.opac')
        os.makedirs(user_data_dir, exist_ok=True)
        db_path = os.path.join(user_data_dir, 'tasks.db')

        # Copier la DB initiale si elle n'existe pas
        if not os.path.exists(db_path):
            import shutil
            template_db = os.path.join(get_base_path(), 'tasks.db')
            if os.path.exists(template_db):
                shutil.copy(template_db, db_path)

        return db_path
    else:
        # ⭐ MODIFICATION ICI : DB directement dans backend/
        return os.path.join(
            get_base_path(),  # ← Suppression du os.path.dirname()
            'tasks.db'
        )

DB_PATH = get_db_path()
print(DB_PATH)

def init_db_if_needed():
    """Initialiser la base si elle n'existe pas"""
    if not os.path.exists(DB_PATH):
        print("⚠️  Base de données introuvable, initialisation...")
        from init_db import init_database
        init_database()

def get_db():
    """Connexion à la base de données avec gestion des erreurs"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        # Activer les clés étrangères
        conn.execute('PRAGMA foreign_keys = ON')
        return conn
    except sqlite3.Error as e:
        print(f"❌ Erreur connexion DB: {e}")
        init_db_if_needed()
        raise

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """GET /api/health - Vérifier l'état du serveur"""
    try:
        conn = get_db()
        # Test de lecture
        conn.execute('SELECT 1').fetchone()
        conn.close()
        
        # Informations sur la base
        db_size = os.path.getsize(DB_PATH) / 1024  # Ko
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'database': {
                'path': DB_PATH,
                'size_kb': round(db_size, 2),
                'exists': os.path.exists(DB_PATH)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

# Routes Frontend
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tasks')
def tasks():
    return render_template('tasks.html')

@app.route('/projects')
def projects():
    return render_template('projects.html')

@app.route('/timeline')
def timeline():
    return render_template('timeline.html')

@app.route('/project')
def project():
    return render_template('project.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

# ==================== PROJECTS ====================

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """GET /api/projects - Récupérer tous les projets"""
    try:
        conn = get_db()
        projects = conn.execute('SELECT * FROM projects ORDER BY creation_date DESC').fetchall()
        conn.close()
        return jsonify({
            'success': True,
            'data': [dict(project) for project in projects]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    """GET /api/projects/:id - Récupérer un projet"""
    try:
        conn = get_db()
        project = conn.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
        conn.close()
        
        if not project:
            return jsonify({'success': False, 'error': 'Projet introuvable'}), 404
        
        return jsonify({'success': True, 'data': dict(project)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects', methods=['POST'])
def create_project():
    """POST /api/projects - Créer un projet"""
    try:
        data = request.json
        conn = get_db()
        cursor = conn.execute(
            'INSERT INTO projects (name, description) VALUES (?, ?)',
            (data['name'], data.get('description', ''))
        )
        conn.commit()
        project_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {'id': project_id}
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>/name', methods=['PATCH'])
def update_project_name(project_id):
    """PATCH /api/projects/:id/name - Mettre à jour le nom"""
    try:
        data = request.json
        name = data.get('name', '')
        
        if len(name) == 0:
            return jsonify({'success': False, 'error': 'Le projet doit avoir un nom.'}), 400
        
        conn = get_db()
        conn.execute(
            'UPDATE projects SET name = ?, last_update_date = CURRENT_TIMESTAMP WHERE id = ?',
            (name, project_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>/description', methods=['PATCH'])
def update_project_description(project_id):
    """PATCH /api/projects/:id/description - Mettre à jour la description"""
    try:
        data = request.json
        description = data.get('description', '')
        
        conn = get_db()
        conn.execute(
            'UPDATE projects SET description = ?, last_update_date = CURRENT_TIMESTAMP WHERE id = ?',
            (description, project_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>/progress-date', methods=['PATCH'])
def update_project_progress_date(project_id):
    """PATCH /api/projects/:id/progress-date - Mettre à jour la date de progression"""
    try:
        conn = get_db()
        conn.execute(
            'UPDATE projects SET last_progress_date = CURRENT_TIMESTAMP WHERE id = ?',
            (project_id,)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """DELETE /api/projects/:id - Supprimer un projet"""
    try:
        conn = get_db()
        result = conn.execute('DELETE FROM projects WHERE id = ?', (project_id,))
        conn.commit()
        
        if result.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Projet introuvable'}), 404
        
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects', methods=['DELETE'])
def clear_all_projects():
    """DELETE /api/projects - Supprimer tous les projets"""
    try:
        conn = get_db()
        result = conn.execute('DELETE FROM projects')
        conn.commit()
        
        if result.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Réinitialisation échouée'}), 400
        
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== TASKS ====================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """GET /api/tasks?project_id=X - Récupérer les tâches (avec filtre optionnel)"""
    try:
        project_id = request.args.get('project_id')
        
        conn = get_db()
        
        if project_id:
            tasks = conn.execute(
                'SELECT * FROM tasks WHERE project_id = ? ORDER BY creation_date DESC',
                (project_id,)
            ).fetchall()
        else:
            tasks = conn.execute('SELECT * FROM tasks ORDER BY creation_date DESC').fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': [dict(task) for task in tasks]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """GET /api/tasks/:id - Récupérer une tâche"""
    try:
        conn = get_db()
        task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
        conn.close()
        
        if not task:
            return jsonify({'success': False, 'error': 'Tâche introuvable'}), 404
        
        return jsonify({'success': True, 'data': dict(task)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/high-priority', methods=['GET'])
def get_high_priority_tasks():
    """GET /api/tasks/high-priority - Récupérer les tâches prioritaires"""
    try:
        conn = get_db()
        tasks = conn.execute("SELECT * FROM tasks WHERE priority = 'high' AND status != 'done'").fetchall()
        conn.close()
        
        if not tasks:
            return jsonify({'success': False, 'error': 'Aucune tâche importante'}), 404
        
        return jsonify({'success': True, 'data': [dict(task) for task in tasks]})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/due-soon', methods=['GET'])
def get_due_soon_tasks():
    """GET /api/tasks/due-soon - Récupérer les tâches à échéance proche"""
    try:
        conn = get_db()
        tasks = conn.execute("""
            SELECT * FROM tasks
            WHERE datetime(deadline) < datetime('now', '+2 days')
            AND status != 'done'
            ORDER BY deadline ASC
        """).fetchall()
        conn.close()
        
        if not tasks:
            return jsonify({'success': False, 'error': 'Aucune tâche à échéance proche'}), 404
        
        return jsonify({'success': True, 'data': [dict(task) for task in tasks]})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """POST /api/tasks - Créer une tâche"""
    try:
        data = request.json
        conn = get_db()
        cursor = conn.execute(
            '''INSERT INTO tasks 
            (title, description, deadline, status, priority, load, responsible, project_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                data['title'],
                data.get('description', ''),
                data.get('deadline'),
                data.get('status', 'todo'),
                data.get('priority', 'haute'),
                data.get('load', 0.0),
                data.get('responsible', ''),
                data.get('project_id')
            )
        )
        conn.commit()
        task_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {'id': task_id}
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/title', methods=['PATCH'])
def update_task_title(task_id):
    """PATCH /api/tasks/:id/title"""
    try:
        data = request.json
        title = data.get('title', '')
        
        if len(title) == 0:
            return jsonify({'success': False, 'error': 'Le projet doit avoir un nom.'}), 400
        
        conn = get_db()
        conn.execute(
            'UPDATE tasks SET title = ?, last_update_date = CURRENT_TIMESTAMP WHERE id = ?',
            (title, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/description', methods=['PATCH'])
def update_task_description(task_id):
    """PATCH /api/tasks/:id/description"""
    try:
        data = request.json
        description = data.get('description', '')
        
        conn = get_db()
        conn.execute(
            'UPDATE tasks SET description = ?, last_update_date = CURRENT_TIMESTAMP WHERE id = ?',
            (description, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/deadline', methods=['PATCH'])
def update_task_deadline(task_id):
    """PATCH /api/tasks/:id/deadline"""
    try:
        data = request.json
        deadline = data.get('deadline')
        
        conn = get_db()
        conn.execute(
            'UPDATE tasks SET deadline = ?, last_update_date = CURRENT_TIMESTAMP WHERE id = ?',
            (deadline, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/status', methods=['PATCH'])
def update_task_status(task_id):
    """PATCH /api/tasks/:id/status"""
    try:
        data = request.json
        status = data.get('status')
        
        conn = get_db()
        conn.execute(
            '''UPDATE tasks 
            SET status = ?, last_update_date = CURRENT_TIMESTAMP, last_status_change_date = CURRENT_TIMESTAMP 
            WHERE id = ?''',
            (status, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/priority', methods=['PATCH'])
def update_task_priority(task_id):
    """PATCH /api/tasks/:id/priority"""
    try:
        data = request.json
        priority = data.get('priority')
        
        conn = get_db()
        conn.execute(
            'UPDATE tasks SET priority = ?, last_update_date = CURRENT_TIMESTAMP WHERE id = ?',
            (priority, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/load', methods=['PATCH'])
def update_task_load(task_id):
    """PATCH /api/tasks/:id/load"""
    try:
        data = request.json
        load = data.get('load')
        
        conn = get_db()
        conn.execute(
            'UPDATE tasks SET load = ?, last_update_date = CURRENT_TIMESTAMP WHERE id = ?',
            (load, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/responsible', methods=['PATCH'])
def update_task_responsible(task_id):
    """PATCH /api/tasks/:id/responsible"""
    try:
        data = request.json
        responsible = data.get('responsible')
        
        conn = get_db()
        conn.execute(
            'UPDATE tasks SET responsible = ?, last_update_date = CURRENT_TIMESTAMP WHERE id = ?',
            (responsible, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/project', methods=['PATCH'])
def update_task_project(task_id):
    """PATCH /api/tasks/:id/project"""
    try:
        data = request.json
        project_id = data.get('project_id')
        
        conn = get_db()
        conn.execute(
            'UPDATE tasks SET project_id = ?, last_update_date = CURRENT_TIMESTAMP WHERE id = ?',
            (project_id, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/last-update', methods=['PATCH'])
def update_task_last_update(task_id):
    """PATCH /api/tasks/:id/last-update"""
    try:
        data = request.json
        last_update_date = data.get('last_update_date')
        
        conn = get_db()
        conn.execute(
            'UPDATE tasks SET last_update_date = ? WHERE id = ?',
            (last_update_date, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/last-status-change', methods=['PATCH'])
def update_task_last_status_change(task_id):
    """PATCH /api/tasks/:id/last-status-change"""
    try:
        data = request.json
        last_status_change_date = data.get('last_status_change_date')
        
        conn = get_db()
        conn.execute(
            'UPDATE tasks SET last_status_change_date = ? WHERE id = ?',
            (last_status_change_date, task_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """DELETE /api/tasks/:id - Supprimer une tâche"""
    try:
        conn = get_db()
        result = conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        conn.commit()
        
        if result.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Tâche introuvable'}), 404
        
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks', methods=['DELETE'])
def delete_tasks():
    """DELETE /api/tasks?project_id=X - Supprimer toutes les tâches (ou d'un projet)"""
    try:
        project_id = request.args.get('project_id')
        
        conn = get_db()
        
        if project_id:
            result = conn.execute('DELETE FROM tasks WHERE project_id = ?', (project_id,))
        else:
            result = conn.execute('DELETE FROM tasks')
        
        conn.commit()
        
        if result.rowcount == 0 and not project_id:
            conn.close()
            return jsonify({'success': False, 'error': 'Réinitialisation échouée'}), 400
        
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)