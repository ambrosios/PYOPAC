function resetAppData() {
    let go = confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données (irréversible) ?");

    if(go) {
        window.app.projects.clearAll();
        window.app.tasks.clearAll();
    } else {
        alert("Action abandonnée");
    }
}