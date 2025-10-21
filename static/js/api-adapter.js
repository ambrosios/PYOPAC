/**
 * Adaptateur IPC → API REST pour OPAC
 * Traduit window.api.{resource}.{method}() en appels fetch()
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Gestion des erreurs et format de réponse unifié
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();

        // Format compatible avec l'ancien IPC { success, data, error }
        if (!response.ok) {
            return { success: false, error: data.error || 'Erreur serveur' };
        }

        return data; // Le backend retourne déjà { success: true, data: ... }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * API publique - structure identique à l'ancien IPC
 */
window.api = {
    
    // ==================== PROJECTS ====================
    projects: {
        /**
         * Récupérer tous les projets
         * IPC: projects:getAll
         * API: GET /api/projects
         */
        getAll: async () => {
            return apiRequest(`${API_BASE_URL}/projects`);
        },

        /**
         * Récupérer un projet par ID
         * IPC: projects:getById
         * API: GET /api/projects/:id
         */
        getById: async (id) => {
            return apiRequest(`${API_BASE_URL}/projects/${id}`);
        },

        /**
         * Créer un nouveau projet
         * IPC: projects:create
         * API: POST /api/projects
         */
        create: async (projectData) => {
            return apiRequest(`${API_BASE_URL}/projects`, {
                method: 'POST',
                body: JSON.stringify(projectData)
            });
        },

        /**
         * Mettre à jour le nom d'un projet
         * IPC: projects:updateName
         * API: PATCH /api/projects/:id/name
         */
        updateName: async (id, name) => {
            return apiRequest(`${API_BASE_URL}/projects/${id}/name`, {
                method: 'PATCH',
                body: JSON.stringify({ name })
            });
        },

        /**
         * Mettre à jour la description
         * IPC: projects:updateDescription
         * API: PATCH /api/projects/:id/description
         */
        updateDescription: async (id, description) => {
            return apiRequest(`${API_BASE_URL}/projects/${id}/description`, {
                method: 'PATCH',
                body: JSON.stringify({ description })
            });
        },

        /**
         * Mettre à jour la date de progression
         * IPC: projects:updateProgressDate
         * API: PATCH /api/projects/:id/progress-date
         */
        updateProgressDate: async (id) => {
            return apiRequest(`${API_BASE_URL}/projects/${id}/progress-date`, {
                method: 'PATCH'
            });
        },

        /**
         * Supprimer un projet
         * IPC: projects:delete
         * API: DELETE /api/projects/:id
         */
        delete: async (id) => {
            return apiRequest(`${API_BASE_URL}/projects/${id}`, {
                method: 'DELETE'
            });
        },

        /**
         * Supprimer tous les projets
         * IPC: projects:clearAll
         * API: DELETE /api/projects
         */
        clearAll: async () => {
            return apiRequest(`${API_BASE_URL}/projects`, {
                method: 'DELETE'
            });
        }
    },

    // ==================== TASKS ====================
    tasks: {
        /**
         * Récupérer toutes les tâches
         * IPC: tasks:getAll
         * API: GET /api/tasks
         */
        getAll: async () => {
            return apiRequest(`${API_BASE_URL}/tasks`);
        },

        /**
         * Récupérer une tâche par ID
         * IPC: tasks:getById
         * API: GET /api/tasks/:id
         */
        getById: async (id) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}`);
        },

        /**
         * Récupérer les tâches d'un projet
         * IPC: tasks:getByProjectId
         * API: GET /api/tasks?project_id=X
         */
        getByProjectId: async (projectId) => {
            return apiRequest(`${API_BASE_URL}/tasks?project_id=${projectId}`);
        },

        /**
         * Récupérer les tâches prioritaires
         * IPC: tasks:getHighPriority
         * API: GET /api/tasks/high-priority
         */
        getHighPriority: async () => {
            return apiRequest(`${API_BASE_URL}/tasks/high-priority`);
        },

        /**
         * Récupérer les tâches à échéance proche
         * IPC: tasks:getDueSoon
         * API: GET /api/tasks/due-soon
         */
        getDueSoon: async () => {
            return apiRequest(`${API_BASE_URL}/tasks/due-soon`);
        },

        /**
         * Créer une nouvelle tâche
         * IPC: tasks:create
         * API: POST /api/tasks
         */
        create: async (taskData) => {
            return apiRequest(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
        },

        /**
         * Mettre à jour le titre
         * IPC: tasks:updateTitle
         * API: PATCH /api/tasks/:id/title
         */
        updateTitle: async (id, title) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/title`, {
                method: 'PATCH',
                body: JSON.stringify({ title })
            });
        },

        /**
         * Mettre à jour la description
         * IPC: tasks:updateDescription
         * API: PATCH /api/tasks/:id/description
         */
        updateDescription: async (id, description) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/description`, {
                method: 'PATCH',
                body: JSON.stringify({ description })
            });
        },

        /**
         * Mettre à jour la deadline
         * IPC: tasks:updateDeadline
         * API: PATCH /api/tasks/:id/deadline
         */
        updateDeadline: async (id, deadline) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/deadline`, {
                method: 'PATCH',
                body: JSON.stringify({ deadline })
            });
        },

        /**
         * Mettre à jour le statut
         * IPC: tasks:updateStatus
         * API: PATCH /api/tasks/:id/status
         */
        updateStatus: async (id, status) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
        },

        /**
         * Mettre à jour la priorité
         * IPC: tasks:updatePriority
         * API: PATCH /api/tasks/:id/priority
         */
        updatePriority: async (id, priority) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/priority`, {
                method: 'PATCH',
                body: JSON.stringify({ priority })
            });
        },

        /**
         * Mettre à jour la charge
         * IPC: tasks:updateLoad
         * API: PATCH /api/tasks/:id/load
         */
        updateLoad: async (id, load) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/load`, {
                method: 'PATCH',
                body: JSON.stringify({ load })
            });
        },

        /**
         * Mettre à jour le responsable
         * IPC: tasks:updateResponsible
         * API: PATCH /api/tasks/:id/responsible
         */
        updateResponsible: async (id, responsible) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/responsible`, {
                method: 'PATCH',
                body: JSON.stringify({ responsible })
            });
        },

        /**
         * Mettre à jour le projet associé
         * IPC: tasks:updateProjectId
         * API: PATCH /api/tasks/:id/project
         */
        updateProjectId: async (id, project_id) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/project`, {
                method: 'PATCH',
                body: JSON.stringify({ project_id })
            });
        },

        /**
         * Mettre à jour la date de dernière modification
         * IPC: tasks:updateLastUpdateDate
         * API: PATCH /api/tasks/:id/last-update
         */
        updateLastUpdateDate: async (id, last_update_date) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/last-update`, {
                method: 'PATCH',
                body: JSON.stringify({ last_update_date })
            });
        },

        /**
         * Mettre à jour la date de changement de statut
         * IPC: tasks:updateLastStatusChangeDate
         * API: PATCH /api/tasks/:id/last-status-change
         */
        updateLastStatusChangeDate: async (id, last_status_change_date) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}/last-status-change`, {
                method: 'PATCH',
                body: JSON.stringify({ last_status_change_date })
            });
        },

        /**
         * Supprimer une tâche
         * IPC: tasks:delete
         * API: DELETE /api/tasks/:id
         */
        delete: async (id) => {
            return apiRequest(`${API_BASE_URL}/tasks/${id}`, {
                method: 'DELETE'
            });
        },

        /**
         * Supprimer toutes les tâches d'un projet
         * IPC: tasks:deleteProjectTasks
         * API: DELETE /api/tasks?project_id=X
         */
        deleteProjectTasks: async (project_id) => {
            return apiRequest(`${API_BASE_URL}/tasks?project_id=${project_id}`, {
                method: 'DELETE'
            });
        },

        /**
         * Supprimer toutes les tâches
         * IPC: tasks:clearAll
         * API: DELETE /api/tasks
         */
        clearAll: async () => {
            return apiRequest(`${API_BASE_URL}/tasks`, {
                method: 'DELETE'
            });
        }
    }
};

console.log('✅ API Adapter chargé - Projects & Tasks');
