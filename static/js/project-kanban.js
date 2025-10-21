/* ========================================
   🎯 KANBAN - GESTION COMPLÈTE
   - Si this.projectId != null : kanban projet 
   - Si this.projectId = null : kanban sur toutes les tâches
======================================== */

class Kanban {
    constructor(projectId = null) {
        this.projectId = null;
        this.project = null;
        this.tasks = [];
        this.draggedTask = null;
        this.editingTaskId = null;

        // Paramètres de tri
        this.sortBy = 'creation_date';
        this.sortOrder = 'desc';
        this.filterPriority = 'all';


        this.init(projectId);
    }

    // ============================================
    // 🚀 INITIALISATION
    // ============================================
    
    async init(projectId = null) {
        try {
            
            if (projectId) {
                this.projectId = projectId;
                await this.loadProject();
            }

            await this.loadTasks();
            this.initEventListeners();
            this.loadProjectsInModal();

        } catch (error) {
            console.error('❌ Erreur initialisation :', error);
            showNotification('Erreur : Erreur lors du chargement du projet', 'error');
        }
    }

    // ============================================
    // 📂 CHARGEMENT DES DONNÉES
    // ============================================

    async loadProject() {
        this.project = await window.api.projects.getById(this.projectId);
        
        if (!this.project) {
            throw new Error('Projet introuvable');
        } else {
            console.log('✅ Projet chargé', this.project.data);

            document.querySelector('.page-header h1').textContent = this.project.data.name;
            document.querySelector('title').textContent = "[OPAC] Kanban \"" + this.project.data.name + "\"";
        }
        
        // document.getElementById('project-name').textContent = this.project.title;
        // document.getElementById('project-description').textContent = 
        //     this.project.description || 'Aucune description';
    }

    async loadTasks() {
        try {
            let req = {};
            if(this.projectId) {
                req = await window.api.tasks.getByProjectId(this.projectId);
            } else {
                req = await window.api.tasks.getAll();
            }
            if(req.success) {
                this.tasks = req.data;
                console.log("✅ Tâches chargées", this.tasks)
            } else {
                console.error('❌ Erreur chargement des tâches :', req.error);
                showNotification('Erreur : Les tâches n\'ont pas pu être chargées.', 'error');
            }
            this.renderKanban();
            this.updateCounters();
        } catch(error) {
            console.error('❌ Erreur chargement des tâches :', error);
            showNotification('Erreur : Les tâches n\'ont pas pu être chargées.', 'error');
        }
    }

    // ============================================
    // 🎨 AFFICHAGE DU KANBAN
    // ============================================

    async renderKanban() {
        // Vider les colonnes
        ['todo', 'in-progress', 'done'].forEach(status => {
            const column = document.getElementById(`column-${status}`);
            column.innerHTML = '';
        });
        
        console.log("✅ Colonnes réinitialisées");

        // Récupérer les tâches filtrées et triées
        const sortedTasks = this.getFilteredAndSortedTasks();

        // Grouper par statut
        const tasksByStatus = {
            'todo': [],
            'in-progress': [],
            'done': []
        };

        sortedTasks.forEach(task => {
            if (tasksByStatus[task.status]) {
                tasksByStatus[task.status].push(task);
            }
        });

        // Afficher dans chaque colonne
        for (const [status, tasks] of Object.entries(tasksByStatus)) {
            const column = document.getElementById(`column-${status}`);
            
            for (const task of tasks) {
                const card = await this.createTaskCard(task);
                column.appendChild(card);
            }
        }

        // await Promise.all(
        //     this.tasks.map(async (task) => {
        //         const card = await this.createTaskCard(task);
        //         const column = document.getElementById(`column-${task.status}`);
        //         column.appendChild(card);
        //     })
        // );

        console.log("✅ Tâches ajoutées aux colonnes (triées)");

        console.log("✅ Tâches ajoutées aux colonnes");
    }

    async createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.taskId = task.id;

        // Priorité
        const priorityEmoji = {
            'low': '🟢',
            'medium': '🟡',
            'high': '🔴'
        };

        // Date d'échéance avec couleur
        let dueDateHTML = '';
        if (task.deadline) {
            const dueClass = this.getDueDateClass(task.deadline);
            const dateFormatted = new Date(task.deadline).toLocaleDateString('fr-FR');
            dueDateHTML = `<div class="task-due-date ${dueClass}">📅 ${dateFormatted}</div>`;
        }
        
        let projectHTML = '';
        if (!this.projectId) {
            const project = await window.api.projects.getById(task.project_id);
            if(project.success) {
                projectHTML = `<div class="task-project"><span>📂 ${project.data.name}</span></div>`;
            }
        }

        // Description tronquée (2 lignes max)
        const shortDescription = truncateText(task.description, 80);

        card.innerHTML = `
            <div class="task-header">
            <span class="task-priority">${priorityEmoji[task.priority || 'medium']}</span>
            <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
            </div>
            ${shortDescription ? `<p class="task-description">${this.escapeHtml(shortDescription)}</p>` : ''}
            ${projectHTML}
            ${dueDateHTML}
        `;

        // Événements
        card.addEventListener('click', () => this.openEditModal(task));
        card.addEventListener('dragstart', (e) => this.handleDragStart(e, task));
        card.addEventListener('dragend', (e) => this.handleDragEnd(e));

        return card;
    }

    getDueDateClass(dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue'; // Passé = rouge
        if (diffDays <= 2 && this.isWorkingDay(due)) return 'due-soon'; // 2j ouvrés = orange
        return '';
    }

    isWorkingDay(date) {
        const day = date.getDay();
        return day !== 0 && day !== 6; // Pas samedi (6) ni dimanche (0)
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // 🖱️ DRAG & DROP
    // ============================================

    initEventListeners() {
        // Bouton nouvelle tâche
        document.getElementById('btn-add-task').addEventListener('click', () => {
            this.openCreateModal();
        });

        // Contrôles de tri
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderKanban();
        });

        document.getElementById('sort-order').addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.renderKanban();
        });

        document.getElementById('filter-priority').addEventListener('change', (e) => {
            this.filterPriority = e.target.value;
            this.renderKanban();
        });

        // Fermeture modal
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Formulaire
        document.getElementById('form-task').addEventListener('submit', (e) => {
            this.handleSubmitTask(e);
        });

        // Bouton supprimer
        document.getElementById('btn-delete-task').addEventListener('click', () => {
            this.handleDeleteTask();
        });

        // Drop zones
        document.querySelectorAll('.column-content').forEach(column => {
            column.addEventListener('dragover', (e) => this.handleDragOver(e));
            column.addEventListener('drop', (e) => this.handleDrop(e));
            column.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
    }

    handleDragStart(e, task) {
        this.draggedTask = task;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        if (e.currentTarget === e.target) {
            e.currentTarget.classList.remove('drag-over');
        }
    }

    async handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (!this.draggedTask) return;

        const newStatus = e.currentTarget.dataset.status;
        
        if (this.draggedTask.status !== newStatus) {
            const exStatus = this.draggedTask.status;
            this.draggedTask.status = newStatus;
            this.draggedTask.modifiedAt = new Date().toISOString();
            
            // await window.api.tasks.updateTask(this.projectId, this.draggedTask.id, this.draggedTask);
            const req = await window.api.tasks.updateStatus(this.draggedTask.id, newStatus);
            if(req.success) {
                console.log("✅ Tâche", this.draggedTask.title, "modifié de", exStatus, "à", newStatus);
                const progressProject = await window.api.projects.updateProgressDate(this.draggedTask.project_id);
                if(progressProject.success) {
                    console.log("✅ Avancement du projet");
                } else {
                    console.log("❌ L'avancement du projet a échoué");
                }
                showNotification("Statut de la tâche " + this.draggedTask.title + " changé !");
            } else {
                console.log("❌ Erreur changement statut", req.error);
                showNotification('Erreur : Le statut de la tâche n\'a pas pu être modifié.', 'error');
            }
            await this.loadTasks();
        }

        this.draggedTask = null;
    }

    // ============================================
    // 🔄 TRI ET FILTRAGE
    // ============================================

    getFilteredAndSortedTasks() {
        let tasks = [...this.tasks];

        // 1️⃣ Filtrer par priorité
        if (this.filterPriority !== 'all') {
            tasks = tasks.filter(task => task.priority === this.filterPriority);
        }

        // 2️⃣ Trier
        tasks.sort((a, b) => {
            let comparison = 0;

            switch (this.sortBy) {
                case 'creation_date':
                    comparison = new Date(a.creation_date) - new Date(b.creation_date);
                    break;

                case 'deadline':
                    // Mettre les tâches sans deadline à la fin
                    if (!a.deadline && !b.deadline) comparison = 0;
                    else if (!a.deadline) comparison = 1;
                    else if (!b.deadline) comparison = -1;
                    else comparison = new Date(a.deadline) - new Date(b.deadline);
                    break;

                case 'priority':
                    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                    comparison = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
                    break;

                case 'title':
                    comparison = a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
                    break;

                case 'last_update_date':
                    const dateA = a.last_update_date || a.creation_date;
                    const dateB = b.last_update_date || b.creation_date;
                    comparison = new Date(dateA) - new Date(dateB);
                    break;

                default:
                    comparison = 0;
            }

            // Inverser si ordre décroissant
            return this.sortOrder === 'desc' ? -comparison : comparison;
        });

        return tasks;
    }

    // ============================================
    // 📝 GESTION DES MODALS
    // ============================================

    async loadProjectsInModal() {
        const projects = await window.api.projects.getAll();
        
        projects.data.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.innerHTML = p.name;
            
            document.querySelector('#modal-task #task-project').appendChild(option);
        });
        
    }

    openCreateModal() {
        this.editingTaskId = null;
        
        document.getElementById('modal-title').textContent = 'Nouvelle tâche';
        document.getElementById('btn-submit-text').textContent = 'Créer la tâche';
        document.getElementById('btn-delete-task').style.display = 'none';
        document.getElementById('task-metadata').style.display = 'none';
        
        document.getElementById('form-task').reset();
        document.getElementById('task-status').value = 'todo';
        document.getElementById('task-priority').value = 'medium';
        
        document.getElementById('modal-task').classList.add('active');
    }

    openEditModal(task) {
        this.editingTaskId = task.id;
        
        document.getElementById('modal-title').textContent = 'Modifier la tâche';
        document.getElementById('btn-submit-text').textContent = 'Enregistrer';
        document.getElementById('btn-delete-task').style.display = 'block';
        
        // Remplir le formulaire
        document.getElementById('task-project').value = task.project_id;

        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-dueDate').value = new Date(task.deadline).toLocaleDateString('sv-SE') || '';
        
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-priority').value = task.priority || 'medium';

        
        // Afficher métadonnées
        this.displayMetadata(task);
        
        document.getElementById('modal-task').classList.add('active');
    }

    displayMetadata(task) {
        const metaSection = document.getElementById('task-metadata');
        metaSection.style.display = 'block';
        
        const createdDate = formatLocalDate(task.creation_date);
        const modifiedDate = task.last_update_date ? 
            formatLocalDate(task.last_update_date) : 
            'Jamais modifiée';
        const statusChangedDate = task.last_status_change_date ? 
        formatLocalDate(task.last_status_change_date) : 
        'Jamais modifiée';
        
        const lifetime = this.calculateLifetime(task.creation_date);
        
        document.getElementById('meta-created').textContent = createdDate;
        document.getElementById('meta-modified').textContent = modifiedDate;
        document.getElementById('meta-status-changed').textContent = statusChangedDate;
        document.getElementById('meta-lifetime').textContent = lifetime;
    }

    calculateLifetime(createdAt) {
        const created = new Date(createdAt);
        const now = new Date();
        const diffMs = now - created;
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days}j ${hours}h`;
        return `${hours}h`;
    }

    closeModal() {
        document.getElementById('modal-task').classList.remove('active');
        document.getElementById('form-task').reset();
        this.editingTaskId = null;
    }

    // ============================================
    // 💾 CRUD TÂCHES
    // ============================================

    async handleSubmitTask(e) {
        e.preventDefault();

        const taskData = {
            title: document.getElementById('task-title').value.trim(),
            description: document.getElementById('task-description').value.trim(),
            deadline: document.getElementById('task-dueDate').value,
            status: document.getElementById('task-status').value,
            priority: document.getElementById('task-priority').value,
            project_id: this.projectId
        };

        if(!this.projectId) {
            taskData.project_id = document.getElementById('task-project').value;
        }

        console.log("🔎 Aperçu des données de la tâche vers le handler ipc", taskData);
        

        try {
            if (this.editingTaskId) {
                // Mise à jour
                const existingTask = this.tasks.find(t => t.id === this.editingTaskId);
                const updatedTask = {
                    ...existingTask,
                    ...taskData,
                    modifiedAt: new Date().toISOString()
                };

                let editSuccess = true;
                
                if(existingTask.project_id !== taskData.project_id) {
                    const uProject = await window.api.tasks.updateProjectId(existingTask.id, updatedTask.project_id);
                    if(uProject.success) {
                        console.log("✏️ ✅ Tâche", existingTask.id, ": Projet modifié");
                    } else {
                        console.log("✏️ ❌ Tâche", existingTask.id, ": Projet non modifié -", uProject.error);
                        editSuccess = false;
                        showNotification("Le projet de la tâche n'a pas pu être modifié.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", existingTask.id, ": Pas de modification du projet");
                }

                if(existingTask.title !== taskData.title) {
                    const uTitle = await window.api.tasks.updateTitle(existingTask.id, updatedTask.title);
                    if(uTitle.success) {
                        console.log("✏️ ✅ Tâche", existingTask.id, ": Titre modifié");
                    } else {
                        console.log("✏️ ❌ Tâche", existingTask.id, ": Titre non modifié -", uTitle.error);
                        editSuccess = false;
                        showNotification("Le titre de la tâche n'a pas pu être modifié.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", existingTask.id, ": Pas de modification du titre");
                }

                if(existingTask.description !== taskData.description) {
                    const uDesc = await window.api.tasks.updateDescription(existingTask.id, updatedTask.description);
                    if(uDesc.success) {
                        console.log("✏️ ✅ Tâche", existingTask.id, ": Description modifiée");
                    } else {
                        console.log("✏️ ❌ Tâche", existingTask.id, ": Description non modifiée -", uDesc.error);
                        editSuccess = false;
                        showNotification("La description de la tâche n'a pas pu être modifiée.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", existingTask.id, ": Pas de modification de la description");
                }

                if(existingTask.deadline !== taskData.deadline) {
                    const uDeadline = await window.api.tasks.updateDeadline(existingTask.id, updatedTask.deadline);
                    if(uDeadline.success) {
                        console.log("✏️ ✅ Tâche", existingTask.id, ": Échéance modifiée");
                    } else {
                        console.log("✏️ ❌ Tâche", existingTask.id, ": Échéance non modifiée -", uDeadline.error);
                        editSuccess = false;
                        showNotification("L'échéance de la tâche n'a pas pu être modifiée.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", existingTask.id, ": Pas de modification de l'échéance");
                }
                
                if(existingTask.priority !== taskData.priority) {
                    const uPrio = await window.api.tasks.updatePriority(existingTask.id, updatedTask.priority);
                    if(uPrio.success) {
                        console.log("✏️ ✅ Tâche", existingTask.id, ": Priorité modifiée");
                    } else {
                        console.log("✏️ ❌ Tâche", existingTask.id, ": Priorité non modifiée -", uPrio.error);
                        editSuccess = false;
                        showNotification("Le niveau de priorité de la tâche n'a pas pu être modifié.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", existingTask.id, ": Pas de modification du niveau de priorité");
                }

                if(existingTask.status !== taskData.status) {
                    const uStatus = await window.api.tasks.updateStatus(existingTask.id, updatedTask.status);
                    if(uStatus.success) {
                        console.log("✏️ ✅ Tâche", existingTask.id, ": Statut modifié");
                        const progressProject = await window.api.projects.updateProgressDate(existingTask.project_id);
                        if(progressProject.success) {
                            console.log("✅ Avancement du projet");
                        } else {
                            console.error("❌ L'avancement du projet a échoué");
                        }
                    } else {
                        console.log("✏️ ❌ Tâche", existingTask.id, ": Statut non modifié -", uStatus.error);
                        editSuccess = false;
                        showNotification("Le statut de la tâche n'a pas pu être modifié.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", existingTask.id, ": Pas de modification du statut");
                }
                
                if(editSuccess) {
                    showNotification("Tâche " + updatedTask.title + " modifiée !")
                }

            } else {
                // Création
                console.log("🏗️ Création tâche");
                
                const result = await window.api.tasks.create(taskData);
                if(result.success) {
                    console.log("✅ Renderer : nouvelle tâche", taskData.title, "avec l'id", result.data.id);
                    showNotification('Tâche créée !');
                } else {
                    console.error("❌ Renderer : échéc de la création de la tâche", result.error);
                    showNotification('Erreur : Erreur lors de la création de la tâche', 'error');
                }
                
            }

            await new Promise(r => setTimeout(r, 200));  // Pause de 200ms
            await this.loadTasks();
            this.closeModal();

        } catch (error) {
            console.error('❌ Erreur sauvegarde tâche:', error);
            alert('Erreur lors de la sauvegarde');
        }
    }

    async handleDeleteTask() {
        if (!confirm('Supprimer cette tâche ?')) return;

        try {
            const req = await window.api.tasks.delete(this.editingTaskId);

            if(req.success) {
                console.log('🗑️ ✅ : Tâche avec l\'id', this.editingTaskId, 'supprimée');
                showNotification("Tâche supprimée");
                await this.loadTasks();
                this.closeModal();
            } else {
                console.error('❌ Erreur suppression :', req.error);
                showNotification("La tâche n'a pas pu être supprimée", 'error');
            }
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    }

    // ============================================
    // 📊 COMPTEURS
    // ============================================

    updateCounters() {
        const counts = {
            'todo': 0,
            'in-progress': 0,
            'done': 0
        };

        this.tasks.forEach(task => {
            counts[task.status]++;
        });

        document.getElementById('count-todo').textContent = counts['todo'];
        document.getElementById('count-in-progress').textContent = counts['in-progress'];
        document.getElementById('count-done').textContent = counts['done'];
    }
}

// ============================================
// 🚀 DÉMARRAGE
// ============================================

let kanban;
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (projectId) {
        console.log('⏳ Projet en cours de chargement avec l\'id', projectId);
        kanban = new Kanban(projectId);
    } else {
        console.log('⏳ Chargement de toutes les tâches');
        kanban = new Kanban();
    }
});


async function load() {
    return await window.api.tasks.getAll();
}
console.log(load());