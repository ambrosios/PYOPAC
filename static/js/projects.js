class Projects {
    constructor() { }

    async getAll() {
        const result = await window.api.projects.getAll();
        console.log("📂 Projets récupérés", result);
        return result;
    }

    async addNewProject(newProject) {        
        const result = await window.api.projects.create(newProject)

        if(result.success) {
            newProject.id = result.data.id
            console.log("✅ Renderer : création du projet", newProject.name, "avec l'id", newProject.id)
        } else {
            console.error("❌ Renderer : échéc de la création du projet", result.error)
        }
    }

    async showProjects() {
        const container = document.getElementById('projects-list-container');
        container.innerHTML = '<div class="loader">Chargement...</div>';
        
        try {
            const projects = await this.getAll();
            
            if (!projects.success) {
                throw new Error(projects.error);
            }

            if (projects.data.length === 0) {
                container.innerHTML = '<div class="empty-message">Aucun projet trouvé</div>';
                return;
            }

            // container.innerHTML = projects.data.map(project => `
            // <div class="list-item">
            //     <div class="item-info">
            //     <h3>${escapeHtml(project.name)}</h3>
            //     <p class="item-project-description">
            //         ${escapeHtml(project.description.length > 100 
            //             ? project.description.substring(0, 100) + '...' 
            //             : project.description)}
            //     </p>
            //     <p class="item-meta">
            //         Créé le ${formatDate(project.creation_date)}
            //     </p>
            //     </div>
            //     <div class="item-actions">
            //     <button class="btn btn-secondary btn-sm" onclick="projects.editProject(${project.id})">✏️ Modifier</button>
            //     <button class="btn btn-danger btn-sm" onclick="projects.openProject(${project.id})">🔎 Ouvrir</button>
            //     </div>
            // </div>
            // `).join('');
            
            container.innerHTML = "";

            const projectInstances = await Promise.all(
                projects.data.map(async (project) => {
                    const p = new Project();
                    await p.loadById(project.id);  // ✅ Maintenant on attend !
                    return { project, instance: p };
                })
            );

            projectInstances.forEach(({ project, instance: p }) => {
                const projectCard = document.createElement('div');
                projectCard.classList.add("project-card");
                projectCard.dataset.projectId = project.id;
    
                projectCard.innerHTML = `
                <div class="project-header">
                    <h3>${escapeHtml(p.name)}</h3>
                    <div class="project-actions">
                        <button class="btn-icon project-edit-btn" data-project-id="${p.id}" title="Modifier">
                            ✍️
                        </button>
                        <button class="btn-icon btn-danger project-delete-btn" data-project-id="${p.id}" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <p class="project-description">
                    ${escapeHtml(p.description.length > 100  ? p.description.substring(0, 100) + '...' : p.description)}
                </p>

                <div class="project-stats">
                    <div class="stat-item">
                        🧷
                        <span>${p.stats.total} tâche${p.stats.total > 1 ? 's' : ''}</span>
                    </div>
                    <div class="stat-item">
                        ✅
                        <span>${p.stats.done} terminée${p.stats.done > 1 ? 's' : ''}</span>
                    </div>
                </div>
                
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${p.stats.total > 0 ? p.stats.done / p.stats.total * 100 : 0}%;"></div>
                    </div>
                    <span class="progress-text">${p.stats.total > 0 ? parseInt(p.stats.done / p.stats.total * 100) : 0}%</span>
                </div>
                
                <div class="project-footer">
                    <span class="project-date">
                        <i class="fas fa-calendar"></i>
                        Créé le : ${new Date(p.creation_date).toLocaleDateString('fr-FR')}
                    </span>
                    <button class="btn btn-primary project-open-btn" data-project-id="${p.id}">🔍 Ouvrir</button>
                </div>`;

                container.appendChild(projectCard);
            });

            // container.innerHTML = projects.map(project => `
            // <div class="project-card" data-project-id="${project.id}">
            //     <div class="project-header">
            //         <h3>${escapeHtml(project.name)}</h3>
            //         <div class="project-actions">
            //             <button class="btn-icon project-edit-btn" data-project-id="${project.id}" title="Modifier">
            //                 ✍️
            //             </button>
            //             <button class="btn-icon btn-danger project-delete-btn" data-project-id="${project.id}" title="Supprimer">
            //                 🗑️
            //             </button>
            //         </div>
            //     </div>
                
            //     <p class="project-description">
            //         ${escapeHtml(project.description.length > 100  ? project.description.substring(0, 100) + '...' : project.description)}
            //     </p>

            //     <div class="project-stats">
            //         <div class="stat-item">
            //             🧷
            //             <span>5 tâches</span>
            //         </div>
            //         <div class="stat-item">
            //             ✅
            //             <span>2 terminées</span>
            //         </div>
            //     </div>
                
            //     <div class="project-progress">
            //         <div class="progress-bar">
            //             <div class="progress-fill" style="width: 42%;"></div>
            //         </div>
            //         <span class="progress-text">42%</span>
            //     </div>
                
            //     <div class="project-footer">
            //         <span class="project-date">
            //             <i class="fas fa-calendar"></i>
            //             Créé le : ${new Date(project.creation_date).toLocaleDateString('fr-FR')}
            //         </span>
            //         <button class="btn btn-primary project-open-btn" data-project-id="${project.id}">🔍 Ouvrir</button>
            //     </div>
            // </div>
            //     `
            //     // <div class="project-stats">
            //     //     <div class="stat-item">
            //     //         🧷
            //     //         <span>${project.stats.taskCount} tâche${project.stats.taskCount > 1 ? 's' : ''}</span>
            //     //     </div>
            //     //     <div class="stat-item">
            //     //         ✅
            //     //         <span>${project.stats.completedCount} terminée${project.stats.completedCount > 1 ? 's' : ''}</span>
            //     //     </div>
            //     // </div>
                
            //     // <div class="project-progress">
            //     //     <div class="progress-bar">
            //     //         <div class="progress-fill" style="width: ${project.stats.progress}%"></div>
            //     //     </div>
            //     //     <span class="progress-text">${project.stats.progress}%</span>
            //     // </div>
                
            //     // <div class="project-footer">
            //     //     <span class="project-date">
            //     //         <i class="fas fa-calendar"></i>
            //     //         Créé le : ${new Date(project.createdAt).toLocaleDateString('fr-FR')}
            //     //     </span>
            //     //     <button class="btn btn-sm btn-primary" onclick="openProject('${project.id}')">
            //     //         🔍 Ouvrir
            //     //     </button>
            //     // </div>
            // ).join('');
        
        container.querySelectorAll('.project-edit-btn').forEach(button => {
            button.addEventListener('click', () => { this.editProject(button.dataset.projectId);});
        });
        container.querySelectorAll('.project-delete-btn').forEach(button => {
            button.addEventListener('click', () => { this.deleteProject(button.dataset.projectId);});
        });
        container.querySelectorAll('.project-open-btn').forEach(button => {
            button.addEventListener('click', () => { this.openProject(button.dataset.projectId);});
        });
        
              
        console.log("📋 Projets affichés");
        } catch (error) {
            container.innerHTML = '<div class="empty-message">Erreur lors du chargement</div>';
            showNotification('Erreur: ' + error.message, 'error');
        }
    }

    // Afficher le modal de modification
    async editProject(id) {
        console.log("✏️ Édition du projet", id)
        const project = new Project();
        await project.loadById(id);
        
        document.getElementById('modal-label-edit').style.display = "block";
        document.getElementById('modal-label-create').style.display = "none";

        document.getElementById('modalProjectIdGroup').style.display = "block";
        document.getElementById('modalProjectId').value = project.id;

        document.getElementById('modalProjectName').value = project.name;
        document.getElementById('modalProjectDescription').innerHTML = project.description;
        document.getElementById('modal-project').classList.add('show');

        document.getElementById('modalStats').style.display = "block";
        document.getElementById('modalStatCreationDate').innerHTML = formatLocalDate(project.creation_date);
        document.getElementById('modalStatLastEditDate').innerHTML = formatLocalDate(project.last_update_date);
        document.getElementById('modalStatLastProgressDate').innerHTML = formatLocalDate(project.last_progress_date);
    }

    async deleteProject(id) {
        let go = confirm("Voulez-vous supprimer le projet et toutes ses tâches ? (irréversible)");
        if(go) {
            const reqProject = await window.api.projects.delete(id);
            const reqTasks = await window.api.tasks.deleteProjectTasks(id);
    
            if(reqProject.success && reqTasks.success) {
                console.log("🗑️ Projet n°", id, "supprimé.");
                showNotification('Projet supprimé !');
            } else {
                showNotification('Erreur: ' + reqProject.error.message, 'error');
                showNotification('Erreur: ' + reqTasks.error.message, 'error');
            }
    
            await new Promise(r => setTimeout(r, 200)); // Pause de 200ms

            const projects = new Projects();
            await projects.showProjects();
        } else {
            alert("Suppression annulée");
        }
    }

    // Afficher le modal de modification
    async openProject(id) {
        try {
            document.location.href = "project?id=" + id;
        } catch (error) {
            showNotification('Erreur: ' + error.message, 'error');
        }
    }
}

class Project {
    constructor() {
        this.id = null;
        this.name = "";
        this.description = "";
        this.creation_date = null;
        this.last_update_date = null;
        this.last_progress_date = null;
        this.tasks = [];
        this.stats = {
            todo: 0,
            inProgress: 0,
            done: 0,
            total: 0
        };
    }

    async getId() {
        return this.id;
    }
    
    getName() {
        return  this.name;
    }

    async loadById(id) {
        try {
            const p = await window.api.projects.getById(id);
    
            this.id = p.data.id;
            this.name = p.data.name;
            this.description = p.data.description;
            this.creation_date = p.data.creation_date;
            this.last_update_date = p.data.last_update_date;
            this.last_progress_date = p.data.last_progress_date;
    
            await this.getStats()

            if(p.success) {
                console.log("📥 Projet chargé", p)
            } else {
                console.error("❌ Le projet", id, "n'a pas pû être chargé...")
            }
        } catch(error) {
            showNotification('Erreur: ' + error.message, 'error');
        }
    }

    async updateName(newName) {
        const req = await window.api.projects.updateName(this.id, newName);

        if(req.success) {
            console.log('✅ Nom de projet bien changé de', this.name, 'à', newName);
            this.name = newName;
        } else {
            showNotification('Erreur: ' + req.error, 'error');
        }
    }

    async updateDescription(newDescription) {
        const req = await window.api.projects.updateDescription(this.id, newDescription);

        if(req.success) {
            console.log('✅ Nom de projet bien changé de', this.description, 'à', newDescription);
            this.description = newDescription;
        } else {
            showNotification('Erreur: ' + req.error, 'error');
        }
    }

    async loadTasks() {
        const tasks = await window.api.tasks.getByProjectId(this.id);
        if(tasks.success) {
            this.tasks = tasks.data;
        } else {
            console.error("❌ Chargement tâches du projet :", tasks.error);
        }
    }

    async getStats() {
        await this.loadTasks();

        this.tasks.forEach(task => {
            this.stats.total = this.stats.total + 1;
            switch (task.status) {
                case "todo":
                    this.stats.todo = this.stats.todo + 1;
                    break;
                case "in-progress":
                    this.stats.inProgress = this.stats.inProgress + 1;
                    break;
                case "done":
                    this.stats.done = this.stats.done + 1;
                    break;
                default:
                    break;
            }
        });
        console.log("📊 Statistiques du projet chargées -", this.id, this.stats);
        
    }

}

function newProjectModal() {
    showModal('modal-project');
}


function resetProjectModal() {
    document.getElementById('modalProjectId').value = ""
    document.getElementById('modalProjectName').value = ""
    document.getElementById('modalProjectDescription').innerHTML = ""
    document.getElementById('modalProjectDescription').value = ""

    document.getElementById('modal-label-edit').style.display = "none";
    document.getElementById('modal-label-create').style.display = "block";

    document.getElementById('modalStats').style.display = "none";
    document.getElementById('modalStatCreationDate').value = "";
    document.getElementById('modalStatLastEditDate').value = "";

    console.log("💨 Modal réinitialisé");
}

async function saveProject() {
    if(document.getElementById('modalProjectId').value) {
        // Mode édition
        const p = new Project();
        await p.loadById(document.getElementById('modalProjectId').value);

        console.log(p);
        

        if(p.name != document.querySelector('#modalProjectName').value) {
            await p.updateName(document.querySelector('#modalProjectName').value);
        }
        
        if(p.description != document.querySelector('#modalProjectDescription').value) {
            console.log(document.querySelector('#modalProjectDescription').value);
            
            await p.updateDescription(document.querySelector('#modalProjectDescription').value);
        }

        resetProjectModal();
        hideModal('modal-project');

        await new Promise(r => setTimeout(r, 200));  // Pause de 200ms

        const projects = new Projects();
        projects.showProjects();

    } else {
        // Mode création
        const p = new Project();
        p.name = document.querySelector('#modalProjectName').value;
        p.description = document.querySelector('#modalProjectDescription').value;

        const projects = new Projects();
        projects.addNewProject(p);
        
        resetProjectModal();
        hideModal('modal-project');

        await new Promise(r => setTimeout(r, 200));  // Pause de 200ms

        projects.showProjects();
    }
}

function initEvents() {
    document.querySelector('#saveProjectBtn').addEventListener('click', (e) => {
        e.preventDefault();
        saveProject()
    }, false)

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            resetProjectModal();
            hideModal('modal-project');
        })
    });
}

const projects = new Projects();
projects.showProjects();

initEvents();

// const p = new Project();
// p.betaProject();
// projects.addNewProject(p);
