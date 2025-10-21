// Composants réutilisables

function getSidebar(activePage) {
  // Configuration des éléments du menu
  const menuItems = [
      { id: 'dashboard', icon: '🏠', label: 'Dashboard', href: '/' },
      { id: 'tasks', icon: '📋', label: 'Toutes les tâches', href: 'tasks' },
      { id: 'timeline', icon: '📅', label: 'Timeline', href: 'timeline' },
      { id: 'projects', icon: '📂', label: 'Projets', href: 'projects' },
      { id: 'settings', icon: '⚙️', label: 'Paramètres', href: 'settings' }
  ];

  // Générer le HTML du menu
  const menuHTML = menuItems.map(item => `
      <li>
          <a href="${item.href}" class="${activePage === item.id ? 'active' : ''}">
              <span class="nav-icon">${item.icon}</span>
              <span class="nav-label">${item.label}</span>
          </a>
      </li>
  `).join('');

  return `
      <nav class="sidebar">
          <div class="logo">
            <img src="/static/img/logo/icon256.png" alt="logo"> <h1>OPAC</h1>
          </div>
          <ul class="nav-menu">
              ${menuHTML}
          </ul>
      </nav>
  `;
}
  
  // Header commun
  function getHeader(title) {
    return `
      <header class="page-header">
        <h1>${title}</h1>
        <div class="header-actions">
        </div>
      </header>
    `;
  }
  
  // Footer commun
  function getFooter() {
    return `
      <footer class="page-footer">
        <p>Par Amaury - Tous droits réservés</p>
      </footer>
    `;
  }

  function getTaskModal() {
    return `
    <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2 id="modal-title">Nouvelle tâche</h2>
                    <button class="modal-close btn-close">✕</button>
                </div>
                
                <form id="form-task">
                    <div class="form-group form-group-taskProject">
                        <label for="task-project">Projet</label>
                        <select id="task-project">
                        </select>
                    </div>


                    <div class="form-group">
                        <label for="task-title">Titre de la tâche *</label>
                        <input type="text" id="task-title" required maxlength="100">
                    </div>

                    <div class="form-group">
                        <label for="task-description">Description</label>
                        <textarea id="task-description" rows="4" maxlength="500"></textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="task-dueDate">Date d'échéance</label>
                            <input type="date" id="task-dueDate">
                        </div>

                        <div class="form-group">
                            <label for="task-priority">Priorité</label>
                            <select id="task-priority">
                                <option value="low">🟢 Basse</option>
                                <option value="medium" selected>🟡 Moyenne</option>
                                <option value="high">🔴 Haute</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="task-status">Colonne</label>
                        <select id="task-status">
                            <option value="todo">📋 À faire</option>
                            <option value="in-progress">🚀 En cours</option>
                            <option value="done">✅ Terminé</option>
                        </select>
                    </div>

                    <!-- Métadonnées (visible en mode édition) -->
                    <div id="task-metadata" class="metadata-section" style="display: none;">
                        <h3>📊 Métadonnées</h3>
                        <div class="metadata-grid">
                            <div class="metadata-item">
                                <span class="metadata-label">Créée le :</span>
                                <span id="meta-created">-</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">Modifiée le :</span>
                                <span id="meta-modified">-</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">Dernière avancée :</span>
                                <span id="meta-status-changed">-</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">Durée de vie :</span>
                                <span id="meta-lifetime">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-cancel modal-close">Annuler</button>
                        <button type="submit" class="btn btn-primary">
                            <span id="btn-submit-text">Créer la tâche</span>
                        </button>
                    </div>
                </form>

                <!-- Bouton supprimer (visible en mode édition) -->
                <button id="btn-delete-task" class="btn-danger" style="display: none;">
                    🗑️ Supprimer cette tâche
                </button>
            </div>
    `;
  }

  
  // Initialiser les composants sur une page
  function initComponents(pageName, pageTitle) {
    // Injecter la sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
      sidebarContainer.innerHTML = getSidebar(pageName);
    }
    
    // Injecter le header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.innerHTML = getHeader(pageTitle);
    }
    
    // Injecter le footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      footerContainer.innerHTML = getFooter();
    }

    const taskModalContainer = document.getElementById('modal-task');
    if (taskModalContainer) {
      taskModalContainer.innerHTML = getTaskModal();
    }
  }
  
  // Fonction de navigation
  function navigateTo(page) {
    window.location.href = `${page}.html`;
  }
  
  function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      window.location.href = 'login.html';
    }
  }
  
  function toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }
  
  function showNotifications() {
    alert('Aucune nouvelle notification');
  }
  