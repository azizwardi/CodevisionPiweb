const User = require("../models/user");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

async function showuser(req, res) {
  try {
    const user = await User.find();
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des utilisateurs" });
  }
}
async function showByid(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Erreur lors de la récupération de l'utilisateur:", err);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'utilisateur" });
  }
}
async function update(req, res) {
  try {
    // Vérifier si la requête contient currentPassword et newPassword
    if (req.body.currentPassword && req.body.newPassword) {
      // C'est une demande de changement de mot de passe
      return changePassword(req, res);
    }

    // Supprimer les champs sensibles de la requête
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.currentPassword;
    delete updateData.newPassword;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
  }
}

// Fonction pour changer le mot de passe
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    // Vérifier que les mots de passe sont fournis
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Les mots de passe actuels et nouveaux sont requis" });
    }

    // Vérifier que le nouveau mot de passe est assez long
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères",
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier que le mot de passe actuel est correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect" });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Mot de passe modifié avec succès" });
  } catch (err) {
    console.error("Erreur lors du changement de mot de passe:", err);
    res
      .status(500)
      .json({ message: "Erreur lors du changement de mot de passe" });
  }
}

async function deleteuser(req, res) {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).send("deleted");
  } catch (err) {
    console.log(err);
  }
}
async function add(req, res) {
  try {
    console.log(req.body);
    const user = new User(req.body);
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}

// Fonction pour télécharger une image de profil
async function uploadAvatar(req, res) {
  try {
    console.log("Début de la fonction uploadAvatar");
    console.log("Requête reçue:", {
      params: req.params,
      file: req.file
        ? {
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
    });

    if (!req.file) {
      console.error("Aucun fichier n'a été téléchargé");
      return res
        .status(400)
        .json({ message: "Aucun fichier n'a été téléchargé" });
    }

    const userId = req.params.id;
    console.log("ID utilisateur:", userId);

    const user = await User.findById(userId);
    if (!user) {
      console.error(`Utilisateur avec ID ${userId} non trouvé`);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log("Utilisateur trouvé:", {
      id: user._id,
      username: user.username,
      email: user.email,
    });

    // Construire l'URL de l'image
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log("URL de l'avatar générée:", avatarUrl);

    // Mettre à jour l'URL de l'avatar de l'utilisateur
    user.avatarUrl = avatarUrl;
    await user.save();
    console.log("URL de l'avatar enregistrée dans la base de données");

    // Vérifier que le fichier existe bien sur le disque
    const filePath = path.join(__dirname, "../public", avatarUrl);
    try {
      fs.accessSync(filePath, fs.constants.F_OK);
      console.log(`Le fichier existe sur le disque: ${filePath}`);
    } catch (err) {
      console.warn(
        `Avertissement: Le fichier n'existe pas sur le disque: ${filePath}`
      );
      // On continue quand même car le problème pourrait être ailleurs
    }

    res.status(200).json({
      message: "Image de profil mise à jour avec succès",
      avatarUrl: avatarUrl,
      userId: user._id,
    });
    console.log("Réponse envoyée avec succès");
  } catch (err) {
    console.error("Erreur lors du téléchargement de l'avatar:", err);
    res.status(500).json({
      message: "Erreur lors du téléchargement de l'image de profil",
      error: err.message,
    });
  }
}

module.exports = {
  showuser,
  showByid,
  update,
  deleteuser,
  add,
  changePassword,
  uploadAvatar,
};
