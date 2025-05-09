const fs = require('fs');
const path = require('path');

/**
 * Vérifie et crée les répertoires nécessaires pour le bon fonctionnement de l'application
 */
function ensureDirectories() {
  const directories = [
    path.join(__dirname, '../public'),
    path.join(__dirname, '../public/uploads'),
    path.join(__dirname, '../public/uploads/avatars')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Répertoire créé: ${dir}`);
      } catch (err) {
        console.error(`Erreur lors de la création du répertoire ${dir}:`, err);
      }
    } else {
      console.log(`Répertoire existant: ${dir}`);
      
      // Vérifier les permissions
      try {
        fs.accessSync(dir, fs.constants.W_OK);
        console.log(`Répertoire accessible en écriture: ${dir}`);
      } catch (err) {
        console.error(`Le répertoire ${dir} n'est pas accessible en écriture:`, err);
      }
    }
  });
}

module.exports = ensureDirectories;
