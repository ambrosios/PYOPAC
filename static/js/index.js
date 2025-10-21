// Charger les statistiques au chargement de la page
document.addEventListener('DOMContentLoaded', init);

async function init() {
  initEventListeners();
  await loadStats();
}

function initEventListeners() {
  // Fermeture modal
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal());
  });

  // Formulaire
  document.getElementById('form-task').addEventListener('submit', (e) => {
      handleSubmitTask(e);
  });

  // Bouton supprimer
  document.getElementById('btn-delete-task').addEventListener('click', () => {
    handleDeleteTask();
});
}

async function loadStats() {
  try {
    await loadStatDueDate();
    await loadStatImportant();
      
      // Calculer la valeur totale
      // const totalValue = products.reduce((sum, product) => {
      //   return sum + (product.price * product.stock);
      // }, 0);
      // document.getElementById('totalValue').textContent = formatPrice(totalValue);
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    showNotification('Erreur lors du chargement des statistiques', 'error');
  }

  const projects = await window.api.projects.getAll();
    
  document.querySelector('#modal-task #task-project').innerHTML = "";
  projects.data.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.innerHTML = p.name;
      
      document.querySelector('#modal-task #task-project').appendChild(option);
  });
}

async function loadStatDueDate() {
  document.getElementById('column-dueSoon').innerHTML = '';
  const dueSoonTasks = await window.api.tasks.getDueSoon();
  if (dueSoonTasks.success) {
    document.getElementById('dueSoonTasksCount').textContent = dueSoonTasks.data.length;
    await Promise.all(
        dueSoonTasks.data.map(async (task) => {
            const card = await createTaskCard(task);
            document.getElementById('column-dueSoon').appendChild(card);
        })
    );
  } else {
    console.log("✅ Aucune tâche n'est due pour bientôt.");
  }
}

async function loadStatImportant() {
  document.getElementById('column-importantTask').innerHTML = '';
  const importantTasks = await window.api.tasks.getHighPriority();
  if (importantTasks.success) {
    document.getElementById('importantTasksCount').textContent = importantTasks.data.length;
    await Promise.all(
        importantTasks.data.map(async (task) => {
            const card = await createTaskCard(task);
            document.getElementById('column-importantTask').appendChild(card);
        })
    );
    console.log("✅ Tâches importantes chargées.");
  } else {
        console.log("✅ Aucune tâche importante n'est due.");
  }
}

async function createTaskCard(task) {
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
      const dateFormatted = new Date(task.deadline).toLocaleDateString('fr-FR');
      dueDateHTML = `<div class="task-due-date">📅 ${dateFormatted}</div>`;
  }
  
  let projectHTML = '';
  const project = await window.api.projects.getById(task.project_id);
  if(project.success) {
      projectHTML = `<div class="task-project"><span>📂 ${project.data.name}</span></div>`;
  }

  // Description tronquée (2 lignes max)
  const shortDescription = truncateText(task.description);

  card.innerHTML = `
      <div class="task-header">
      <span class="task-priority">${priorityEmoji[task.priority || 'medium']}</span>
      <h3 class="task-title">${escapeHtml(task.title)}</h3>
      </div>
      ${shortDescription ? `<p class="task-description">${escapeHtml(shortDescription)}</p>` : ''}
      ${projectHTML}
      ${dueDateHTML}
  `;

  card.addEventListener('click', () => openModal(task));

  return card;
}

function openModal(task) {
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
    
    const lifetime = calculateLifetime(task.creation_date);
    
    document.getElementById('meta-created').textContent = createdDate;
    document.getElementById('meta-modified').textContent = modifiedDate;
    document.getElementById('meta-status-changed').textContent = statusChangedDate;
    document.getElementById('meta-lifetime').textContent = lifetime;
    
    showModal('modal-task');
}

function closeModal() {
  hideModal('modal-task');
  document.getElementById('form-task').reset();
}


function calculateLifetime(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}j ${hours}h`;
  return `${hours}h`;
}

async function handleSubmitTask(e) {
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

      await loadStats();
      this.closeModal();

  } catch (error) {
      console.error('❌ Erreur sauvegarde tâche:', error);
      alert('Erreur lors de la sauvegarde');
  }
}
  async function handleDeleteTask() {
    if (!confirm('Supprimer cette tâche ?')) return;
    const taskId = document.getElementById('task-metadata').dataset.id;

    try {
        const req = await window.api.tasks.delete(taskId);

        if(req.success) {
            console.log('🗑️ ✅ : Tâche avec l\'id', taskId, 'supprimée');
            showNotification("Tâche supprimée");
            
            await loadStats();
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