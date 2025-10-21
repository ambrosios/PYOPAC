// === NAVIGATION ===
function navigateTo(page) {
  window.app.navigate(page);
}

// === NOTIFICATIONS ===
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// === FORMATAGE ===
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function convertUTCtoLocal(utcDateString) {
  if (!utcDateString) return null;
  
  // Ajouter 'UTC' pour que JavaScript interprète correctement
  const date = new Date(utcDateString + ' UTC');
  
  return date;
}

function formatLocalDate(utcDateString, locale = 'fr-FR') {
  const date = convertUTCtoLocal(utcDateString);
  if (!date) return null;
  
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Échapper le HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// === CONFIRMATION ===
function confirmDelete(message) {
  return confirm(message || 'Êtes-vous sûr de vouloir supprimer cet élément ?');
}

// === MODAL ===

function showModal(modalId) {
  document.querySelector("#" + modalId).classList.add('show');
}

function hideModal(modalId) {
  document.querySelector("#" + modalId).classList.remove('show')
}