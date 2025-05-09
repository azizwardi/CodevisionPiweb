const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configurer le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../public/uploads/avatars");

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`Répertoire créé: ${uploadDir}`);
      } catch (err) {
        console.error(
          `Erreur lors de la création du répertoire: ${err.message}`
        );
        return cb(
          new Error(
            `Impossible de créer le répertoire de destination: ${err.message}`
          ),
          null
        );
      }
    }

    // Vérifier si le répertoire est accessible en écriture
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log(`Répertoire accessible en écriture: ${uploadDir}`);
    } catch (err) {
      console.error(`Erreur d'accès au répertoire: ${err.message}`);
      return cb(
        new Error(
          `Le répertoire de destination n'est pas accessible en écriture: ${err.message}`
        ),
        null
      );
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique avec l'ID de l'utilisateur et l'horodatage
    const userId = req.params.id || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `user-${userId}-${timestamp}${ext}`;
    console.log(`Nom de fichier généré: ${filename}`);
    cb(null, filename);
  },
});

// Filtrer les types de fichiers (uniquement les images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Type de fichier non pris en charge. Seules les images JPEG, PNG, GIF et WEBP sont autorisées."
      ),
      false
    );
  }
};

// Limiter la taille des fichiers à 5 Mo
const limits = {
  fileSize: 5 * 1024 * 1024, // 5 Mo
};

// Créer le middleware multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

module.exports = upload;
