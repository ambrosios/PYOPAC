/* ========================================
   📅 TIMELINE - GESTION COMPLÈTE
======================================== */

class Timeline {
    constructor() {
        this.tasks = [];
        this.projects = [];
        this.filters = {
            period: 'month',
            dateType: 'deadline',
            status: 'all',
            project: 'all',
            customStart: null,
            customEnd: null
        };
        
        this.init();
    }

    // ============================================
    // 🚀 INITIALISATION
    // ============================================

    async init() {
        try {
            await this.loadProjects();
            await this.loadTasks();
            this.initEventListeners();
            this.render();

            this.loadProjectsInModal()
        } catch (error) {
            console.error('❌ Erreur initialisation timeline:', error);
            showNotification('Erreur lors du chargement', 'error');
        }
    }

    // ============================================
    // 📊 CHARGEMENT DES DONNÉES
    // ============================================

    async loadTasks() {
        try {
            const result = await window.api.tasks.getAll();
            if (result.success) {
                this.tasks = result.data;
                console.log('✅ Tâches chargées:', this.tasks.length);
            }
        } catch (error) {
            console.error('❌ Erreur chargement tâches:', error);
        }
    }

    async loadProjects() {
        try {
            const result = await window.api.projects.getAll();
            if (result.success) {
                this.projects = result.data;
                this.populateProjectFilter();
                console.log('✅ Projets chargés:', this.projects.length);
            }
        } catch (error) {
            console.error('❌ Erreur chargement projets:', error);
        }
    }

    populateProjectFilter() {
        const select = document.getElementById('project-filter');
        const defaultOption = select.querySelector('option[value="all"]');
        select.innerHTML = '';
        select.appendChild(defaultOption);
        
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });
    }

    // ============================================
    // 🖱️ EVENT LISTENERS
    // ============================================

    initEventListeners() {
        // Filtre période
        document.getElementById('period-filter').addEventListener('change', (e) => {
            this.filters.period = e.target.value;
            const customPeriod = document.getElementById('custom-period');
            customPeriod.style.display = e.target.value === 'custom' ? 'flex' : 'none';
            this.render();
        });

        // Filtre type de date
        document.getElementById('date-type').addEventListener('change', (e) => {
            this.filters.dateType = e.target.value;
            this.render();
        });

        // Filtre statut
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.render();
        });

        // Filtre projet
        document.getElementById('project-filter').addEventListener('change', (e) => {
            this.filters.project = e.target.value;
            this.render();
        });

        // Période personnalisée
        document.getElementById('apply-custom-period').addEventListener('click', () => {
            const start = document.getElementById('date-start').value;
            const end = document.getElementById('date-end').value;
            
            if (start && end) {
                this.filters.customStart = new Date(start);
                this.filters.customEnd = new Date(end);
                this.render();
            } else {
                showNotification('Veuillez sélectionner les deux dates', 'error');
            }
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

    }

    // ============================================
    // 🔍 FILTRAGE DES TÂCHES
    // ============================================

    getFilteredTasks() {
        const now = new Date();
        let filtered = [...this.tasks];

        // 1️⃣ Filtrer par période
        const { start, end } = this.getPeriodDates();
        
        filtered = filtered.filter(task => {
            const taskDate = this.getTaskDate(task);
            if (!taskDate) return false;
            return taskDate >= start && taskDate <= end;
        });

        // 2️⃣ Filtrer par statut
        if (this.filters.status !== 'all') {
            if (this.filters.status === 'active') {
                filtered = filtered.filter(t => t.status === 'todo' || t.status === 'in-progress');
            } else if (this.filters.status === 'done') {
                filtered = filtered.filter(t => t.status === 'done');
            } else {
                filtered = filtered.filter(t => t.status === this.filters.status);
            }
        }

        // 3️⃣ Filtrer par projet
        if (this.filters.project !== 'all') {
            filtered = filtered.filter(t => t.project_id === parseInt(this.filters.project));
        }

        return filtered;
    }

    getPeriodDates() {
        const now = new Date();
        let start, end;

        switch (this.filters.period) {
            case 'week':
                start = new Date(now);
                start.setDate(now.getDate() - now.getDay()); // Début semaine
                start.setHours(0, 0, 0, 0);
                
                end = new Date(start);
                end.setDate(start.getDate() + 6); // Fin semaine
                end.setHours(23, 59, 59, 999);
                break;

            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;

            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
                break;

            case 'custom':
                start = this.filters.customStart || new Date(now.getFullYear(), 0, 1);
                end = this.filters.customEnd || new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;

            case 'all':
            default:
                start = new Date(2000, 0, 1);
                end = new Date(2099, 11, 31);
                break;
        }

        return { start, end };
    }

    getTaskDate(task) {
        switch (this.filters.dateType) {
            case 'deadline':
                return task.deadline ? new Date(task.deadline) : null;
            case 'creation':
                return new Date(task.creation_date);
            case 'both':
                return task.deadline ? new Date(task.deadline) : new Date(task.creation_date);
            default:
                return null;
        }
    }

    // ============================================
    // 📊 STATISTIQUES
    // ============================================

    calculateStats(tasks) {
        const now = new Date();
        
        const stats = {
            total: tasks.length,
            upcoming: 0,
            overdue: 0,
            done: 0
        };

        tasks.forEach(task => {
            if (task.status === 'done') {
                stats.done++;
            } else if (task.deadline) {
                const deadline = new Date(task.deadline);
                if (deadline < now) {
                    stats.overdue++;
                } else {
                    stats.upcoming++;
                }
            }
        });

        return stats;
    }

    updateStats(stats) {
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-upcoming').textContent = stats.upcoming;
        document.getElementById('stat-overdue').textContent = stats.overdue;
        document.getElementById('stat-done').textContent = stats.done;
    }

    // ============================================
    // 🎨 RENDU DE LA TIMELINE
    // ============================================

    render() {
        const container = document.getElementById('timeline-content');
        const emptyMessage = document.getElementById('empty-message');
        
        const filteredTasks = this.getFilteredTasks();
        
        // Mettre à jour les stats
        const stats = this.calculateStats(filteredTasks);
        this.updateStats(stats);

        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            emptyMessage.style.display = 'block';
            return;
        }

        emptyMessage.style.display = 'none';

        // Grouper les tâches par période
        const grouped = this.groupTasksByPeriod(filteredTasks);
        
        // Générer le HTML
        container.innerHTML = '';
        
        for (const [period, tasks] of Object.entries(grouped)) {
            const groupElement = this.createTimelineGroup(period, tasks);
            container.appendChild(groupElement);
        }

        console.log('✅ Timeline rendue:', filteredTasks.length, 'tâches');
    }

    groupTasksByPeriod(tasks) {
        const grouped = {};
        const now = new Date();

        tasks.forEach(task => {
            const taskDate = this.getTaskDate(task);
            if (!taskDate) return;

            let periodKey;
            
            // Déterminer la clé de période
            if (this.filters.period === 'week' || this.filters.period === 'month') {
                // Grouper par semaine
                const weekStart = new Date(taskDate);
                weekStart.setDate(taskDate.getDate() - taskDate.getDay());
                periodKey = this.formatWeekPeriod(weekStart);
            } else {
                // Grouper par mois
                periodKey = this.formatMonthPeriod(taskDate);
            }

            if (!grouped[periodKey]) {
                grouped[periodKey] = [];
            }
            grouped[periodKey].push(task);
        });

        // Trier par date
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => {
                const dateA = this.getTaskDate(a);
                const dateB = this.getTaskDate(b);
                return dateA - dateB;
            });
        });

        return grouped;
    }

    formatWeekPeriod(date) {
        const end = new Date(date);
        end.setDate(date.getDate() + 6);
        
        const options = { day: 'numeric', month: 'short' };
        return `${date.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
    }

    formatMonthPeriod(date) {
        const options = { month: 'long', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    }

    createTimelineGroup(period, tasks) {
        const group = document.createElement('div');
        group.className = 'timeline-group';

        const header = document.createElement('div');
        header.className = 'timeline-group-header';
        header.innerHTML = `
            <span class="timeline-group-icon">📅</span>
            <h2 class="timeline-group-title">${period}</h2>
            <span class="timeline-group-count">${tasks.length}</span>
        `;

        const items = document.createElement('div');
        items.className = 'timeline-items';

        tasks.forEach(task => {
            const item = this.createTimelineItem(task);
            items.appendChild(item);
        });

        group.appendChild(header);
        group.appendChild(items);

        return group;
    }

    createTimelineItem(task) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.dataset.priority = task.priority;
        item.dataset.status = task.status;

        const taskDate = this.getTaskDate(task);
        const now = new Date();
        const isOverdue = task.deadline && new Date(task.deadline) < now && task.status !== 'done';

        if (isOverdue) {
            item.classList.add('overdue');
        }

        // Date
        const dateDiv = document.createElement('div');
        dateDiv.className = 'timeline-date';
        dateDiv.innerHTML = `
            <div class="timeline-date-day">${taskDate.getDate()}</div>
            <div class="timeline-date-month">${taskDate.toLocaleDateString('fr-FR', { month: 'short' })}</div>
        `;

        // Card
        const card = document.createElement('div');
        card.className = 'timeline-task-card';
        card.dataset.priority = task.priority;
        card.dataset.status = task.status;
        
        if (isOverdue) {
            card.classList.add('overdue');
        }

        // Badges
        const priorityLabels = {
            high: '🔴 Haute',
            medium: '🟡 Moyenne',
            low: '🟢 Basse'
        };

        const statusLabels = {
            'todo': '📋 À faire',
            'in-progress': '🚀 En cours',
            'done': '✅ Terminé'
        };

        let statusBadgeClass = 'badge-status';
        if (task.status === 'done') statusBadgeClass += ' done';
        if (isOverdue) statusBadgeClass += ' overdue';

        // Récupérer le nom du projet
        const project = this.projects.find(p => p.id === task.project_id);
        const projectName = project ? project.name : 'Sans projet';

        card.innerHTML = `
            <div class="timeline-task-header">
                <h3 class="timeline-task-title">${task.title}</h3>
                <div class="timeline-task-badges">
                    <span class="badge badge-priority-${task.priority}">${priorityLabels[task.priority]}</span>
                    <span class="badge ${statusBadgeClass}">
                        ${isOverdue && task.status !== 'done' ? '⚠️ En retard' : statusLabels[task.status]}
                    </span>
                </div>
            </div>
            ${task.description ? `<p class="timeline-task-description">${task.description}</p>` : ''}
            <div class="timeline-task-meta">
                <span class="timeline-task-project">
                    📁 ${projectName}
                </span>
                ${task.deadline ? `
                    <span class="timeline-task-deadline ${isOverdue ? 'overdue' : ''}">
                        ⏰ ${new Date(task.deadline).toLocaleDateString('fr-FR')}
                    </span>
                ` : ''}
            </div>
        `;

        // Clic pour ouvrir la tâche (TODO: implémenter)
        card.addEventListener('click', () => {
            this.openTaskDetail(task);
        });

        item.appendChild(dateDiv);
        item.appendChild(card);

        return item;
    }

    // ============================================
    // 🔗 ACTIONS
    // ============================================

    openTaskDetail(task) {
        this.loadModal(task)
        showModal("modal-task");
    }

    closeModal() {
        hideModal('modal-task');
        document.getElementById('form-task').reset();
    }

    async loadProjectsInModal() {
        const projects = await window.api.projects.getAll();
        
        projects.data.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.innerHTML = p.name;
            
            document.querySelector('#modal-task #task-project').appendChild(option);
        });
        
    }

    loadModal(task) {
        document.getElementById('task-metadata').dataset.id = task.id;
    
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

    async handleSubmitTask(e) {
        e.preventDefault();
        const taskId = document.getElementById('task-metadata').dataset.id;
        console.log("👁️ Id de la tâche en modification", taskId);
        
        const taskData = {
            id: taskId,
            title: document.getElementById('task-title').value.trim(),
            description: document.getElementById('task-description').value.trim(),
            deadline: document.getElementById('task-dueDate').value,
            status: document.getElementById('task-status').value,
            priority: document.getElementById('task-priority').value,
            project_id: document.getElementById('task-project').value
        };
      
        console.log("🔎 Aperçu des données de la tâche vers le handler ipc", taskData);
        
      
        try {
                // Mise à jour
                const existingTask = await window.api.tasks.getById(taskId);
                const updatedTask = {
                    ...existingTask,
                    ...taskData,
                    modifiedAt: new Date().toISOString()
                };
      
                let editSuccess = true;
                
                if(existingTask.project_id !== taskData.project_id) {
                    const uProject = await window.api.tasks.updateProjectId(updatedTask.id, updatedTask.project_id);
                    if(uProject.success) {
                        console.log("✏️ ✅ Tâche", updatedTask.id, ": Projet modifié");
                    } else {
                        console.log("✏️ ❌ Tâche", updatedTask.id, ": Projet non modifié -", uProject.error);
                        editSuccess = false;
                        showNotification("Le projet de la tâche n'a pas pu être modifié.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", updatedTask.id, ": Pas de modification du projet");
                }
      
                if(existingTask.title !== taskData.title) {
                    const uTitle = await window.api.tasks.updateTitle(updatedTask.id, updatedTask.title);
                    if(uTitle.success) {
                        console.log("✏️ ✅ Tâche", updatedTask.id, ": Titre modifié");
                    } else {
                        console.log("✏️ ❌ Tâche", updatedTask.id, ": Titre non modifié -", uTitle.error);
                        editSuccess = false;
                        showNotification("Le titre de la tâche n'a pas pu être modifié.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", existingTask.id, ": Pas de modification du titre");
                }
      
                if(existingTask.description !== taskData.description) {
                    const uDesc = await window.api.tasks.updateDescription(updatedTask.id, updatedTask.description);
                    if(uDesc.success) {
                        console.log("✏️ ✅ Tâche", updatedTask.id, ": Description modifiée");
                    } else {
                        console.log("✏️ ❌ Tâche", updatedTask.id, ": Description non modifiée -", uDesc.error);
                        editSuccess = false;
                        showNotification("La description de la tâche n'a pas pu être modifiée.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", updatedTask.id, ": Pas de modification de la description");
                }
      
                if(existingTask.deadline !== taskData.deadline) {
                    const uDeadline = await window.api.tasks.updateDeadline(updatedTask.id, updatedTask.deadline);
                    if(uDeadline.success) {
                        console.log("✏️ ✅ Tâche", updatedTask.id, ": Échéance modifiée");
                    } else {
                        console.log("✏️ ❌ Tâche", updatedTask.id, ": Échéance non modifiée -", uDeadline.error);
                        editSuccess = false;
                        showNotification("L'échéance de la tâche n'a pas pu être modifiée.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", updatedTask.id, ": Pas de modification de l'échéance");
                }
                
                if(existingTask.priority !== taskData.priority) {
                    const uPrio = await window.api.tasks.updatePriority(updatedTask.id, updatedTask.priority);
                    if(uPrio.success) {
                        console.log("✏️ ✅ Tâche", updatedTask.id, ": Priorité modifiée");
                    } else {
                        console.log("✏️ ❌ Tâche", updatedTask.id, ": Priorité non modifiée -", uPrio.error);
                        editSuccess = false;
                        showNotification("Le niveau de priorité de la tâche n'a pas pu être modifié.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", updatedTask.id, ": Pas de modification du niveau de priorité");
                }
      
                if(existingTask.status !== taskData.status) {
                    const uStatus = await window.api.tasks.updateStatus(updatedTask.id, updatedTask.status);
                    if(uStatus.success) {
                        console.log("✏️ ✅ Tâche", updatedTask.id, ": Statut modifié");
                        const progressProject = await window.api.projects.updateProgressDate(updatedTask.project_id);
                        if(progressProject.success) {
                          console.log("✅ Avancement du projet");
                        } else {
                          console.log("❌ L'avancement du projet a échoué");
                        }
                    } else {
                        console.log("✏️ ❌ Tâche", updatedTask.id, ": Statut non modifié -", uStatus.error);
                        editSuccess = false;
                        showNotification("Le statut de la tâche n'a pas pu être modifié.", 'error');
                    }
                } else {
                    console.log("✏️ Tâche", updatedTask.id, ": Pas de modification du statut");
                }
                
                if(editSuccess) {
                    showNotification("Tâche " + updatedTask.title + " modifiée !")
                }
      
            await this.loadTasks();
            this.render();
            this.closeModal();
      
        } catch (error) {
            console.error('❌ Erreur sauvegarde tâche:', error);
            alert('Erreur lors de la sauvegarde');
        }
      }

      async handleDeleteTask() {
        if (!confirm('Supprimer cette tâche ?')) return;
        const taskId = document.getElementById('task-metadata').dataset.id;

        try {
            const req = await window.api.tasks.delete(taskId);

            if(req.success) {
                console.log('🗑️ ✅ : Tâche avec l\'id', taskId, 'supprimée');
                showNotification("Tâche supprimée");
                await this.loadTasks();
                this.render();
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
}

// ============================================
// 🚀 DÉMARRAGE
// ============================================

let timeline;
document.addEventListener('DOMContentLoaded', () => {
    timeline = new Timeline();
});
