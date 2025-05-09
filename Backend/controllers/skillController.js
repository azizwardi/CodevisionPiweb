const Skill = require("../models/skill");
const User = require("../models/user");

// Récupérer toutes les compétences
exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    res.status(200).json(skills);
  } catch (error) {
    console.error("Erreur lors de la récupération des compétences:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des compétences",
      error: error.message,
    });
  }
};

// Récupérer une compétence par son ID
exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.skillId);
    if (!skill) {
      return res.status(404).json({ message: "Compétence non trouvée" });
    }
    res.status(200).json(skill);
  } catch (error) {
    console.error("Erreur lors de la récupération de la compétence:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération de la compétence",
      error: error.message,
    });
  }
};

// Créer une nouvelle compétence
exports.createSkill = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Le nom de la compétence est requis" });
    }

    // Vérifier si la compétence existe déjà
    const existingSkill = await Skill.findOne({ name: name });
    if (existingSkill) {
      return res.status(400).json({ message: "Cette compétence existe déjà" });
    }

    const skill = new Skill({
      name,
      description,
      category: category || "technical",
    });

    await skill.save();
    res.status(201).json({ message: "Compétence créée avec succès", skill });
  } catch (error) {
    console.error("Erreur lors de la création de la compétence:", error);
    res.status(500).json({
      message: "Erreur lors de la création de la compétence",
      error: error.message,
    });
  }
};

// Mettre à jour une compétence
exports.updateSkill = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Le nom de la compétence est requis" });
    }

    const skill = await Skill.findById(req.params.skillId);
    if (!skill) {
      return res.status(404).json({ message: "Compétence non trouvée" });
    }

    // Vérifier si le nouveau nom existe déjà pour une autre compétence
    if (name !== skill.name) {
      const existingSkill = await Skill.findOne({ name: name });
      if (existingSkill) {
        return res
          .status(400)
          .json({ message: "Ce nom de compétence est déjà utilisé" });
      }
    }

    skill.name = name;
    skill.description = description || skill.description;
    skill.category = category || skill.category;

    await skill.save();
    res
      .status(200)
      .json({ message: "Compétence mise à jour avec succès", skill });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la compétence:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour de la compétence",
      error: error.message,
    });
  }
};

// Supprimer une compétence
exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.skillId);
    if (!skill) {
      return res.status(404).json({ message: "Compétence non trouvée" });
    }

    // Vérifier si la compétence est utilisée par des utilisateurs
    const usersWithSkill = await User.find({
      "skills.skill": req.params.skillId,
    });
    if (usersWithSkill.length > 0) {
      return res.status(400).json({
        message:
          "Cette compétence est utilisée par des utilisateurs et ne peut pas être supprimée",
        usersCount: usersWithSkill.length,
      });
    }

    await Skill.findByIdAndDelete(req.params.skillId);
    res.status(200).json({ message: "Compétence supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la compétence:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression de la compétence",
      error: error.message,
    });
  }
};

// Ajouter une compétence à un utilisateur
exports.addSkillToUser = async (req, res) => {
  try {
    const { userId, skillId, proficiencyLevel, yearsOfExperience } = req.body;

    if (!userId || !skillId) {
      return res
        .status(400)
        .json({
          message: "L'ID de l'utilisateur et l'ID de la compétence sont requis",
        });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si la compétence existe
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: "Compétence non trouvée" });
    }

    // Vérifier si l'utilisateur a déjà cette compétence
    const hasSkill = user.skills.some((s) => s.skill.toString() === skillId);
    if (hasSkill) {
      return res
        .status(400)
        .json({ message: "L'utilisateur possède déjà cette compétence" });
    }

    // Ajouter la compétence à l'utilisateur
    user.skills.push({
      skill: skillId,
      proficiencyLevel: proficiencyLevel || 3,
      yearsOfExperience: yearsOfExperience || 0,
      addedAt: new Date(),
    });

    await user.save();
    res.status(200).json({
      message: "Compétence ajoutée à l'utilisateur avec succès",
      user: {
        _id: user._id,
        username: user.username,
        skills: user.skills,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout de la compétence à l'utilisateur:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de l'ajout de la compétence à l'utilisateur",
      error: error.message,
    });
  }
};

// Mettre à jour une compétence d'un utilisateur
exports.updateUserSkill = async (req, res) => {
  try {
    const { userId, skillId, proficiencyLevel, yearsOfExperience } = req.body;

    if (!userId || !skillId) {
      return res
        .status(400)
        .json({
          message: "L'ID de l'utilisateur et l'ID de la compétence sont requis",
        });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Trouver l'index de la compétence dans le tableau des compétences de l'utilisateur
    const skillIndex = user.skills.findIndex(
      (s) => s.skill.toString() === skillId
    );
    if (skillIndex === -1) {
      return res
        .status(404)
        .json({ message: "L'utilisateur ne possède pas cette compétence" });
    }

    // Mettre à jour la compétence
    if (proficiencyLevel) {
      user.skills[skillIndex].proficiencyLevel = proficiencyLevel;
    }
    if (yearsOfExperience !== undefined) {
      user.skills[skillIndex].yearsOfExperience = yearsOfExperience;
    }

    await user.save();
    res.status(200).json({
      message: "Compétence de l'utilisateur mise à jour avec succès",
      user: {
        _id: user._id,
        username: user.username,
        skills: user.skills,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la compétence de l'utilisateur:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la mise à jour de la compétence de l'utilisateur",
      error: error.message,
    });
  }
};

// Supprimer une compétence d'un utilisateur
exports.removeSkillFromUser = async (req, res) => {
  try {
    const { userId, skillId } = req.params;

    if (!userId || !skillId) {
      return res
        .status(400)
        .json({
          message: "L'ID de l'utilisateur et l'ID de la compétence sont requis",
        });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur a cette compétence
    const skillIndex = user.skills.findIndex(
      (s) => s.skill.toString() === skillId
    );
    if (skillIndex === -1) {
      return res
        .status(404)
        .json({ message: "L'utilisateur ne possède pas cette compétence" });
    }

    // Supprimer la compétence
    user.skills.splice(skillIndex, 1);

    await user.save();
    res.status(200).json({
      message: "Compétence supprimée de l'utilisateur avec succès",
      user: {
        _id: user._id,
        username: user.username,
        skills: user.skills,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de la compétence de l'utilisateur:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la suppression de la compétence de l'utilisateur",
      error: error.message,
    });
  }
};

// Récupérer les compétences d'un utilisateur
exports.getUserSkills = async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId).populate("skills.skill");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(user.skills);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des compétences de l'utilisateur:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la récupération des compétences de l'utilisateur",
      error: error.message,
    });
  }
};

// Récupérer les compétences requises d'un utilisateur
exports.getUserRequiredSkills = async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId).populate("requiredSkills.skill");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(user.requiredSkills || []);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des compétences requises de l'utilisateur:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la récupération des compétences requises de l'utilisateur",
      error: error.message,
    });
  }
};

// Ajouter une compétence requise à un utilisateur
exports.addRequiredSkillToUser = async (req, res) => {
  try {
    const { userId, skillId, minimumLevel } = req.body;

    if (!userId || !skillId) {
      return res
        .status(400)
        .json({
          message: "L'ID de l'utilisateur et l'ID de la compétence sont requis",
        });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si la compétence existe
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: "Compétence non trouvée" });
    }

    // Vérifier si l'utilisateur a déjà cette compétence requise
    const hasRequiredSkill =
      user.requiredSkills &&
      user.requiredSkills.some((s) => s.skill.toString() === skillId);
    if (hasRequiredSkill) {
      return res
        .status(400)
        .json({
          message: "L'utilisateur possède déjà cette compétence requise",
        });
    }

    // Initialiser le tableau requiredSkills s'il n'existe pas
    if (!user.requiredSkills) {
      user.requiredSkills = [];
    }

    // Ajouter la compétence requise à l'utilisateur
    user.requiredSkills.push({
      skill: skillId,
      minimumLevel: minimumLevel || 1,
    });

    await user.save();
    res.status(200).json({
      message: "Compétence requise ajoutée à l'utilisateur avec succès",
      user: {
        _id: user._id,
        username: user.username,
        requiredSkills: user.requiredSkills,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout de la compétence requise à l'utilisateur:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de l'ajout de la compétence requise à l'utilisateur",
      error: error.message,
    });
  }
};

// Mettre à jour une compétence requise d'un utilisateur
exports.updateUserRequiredSkill = async (req, res) => {
  try {
    const { userId, skillId, minimumLevel } = req.body;

    if (!userId || !skillId) {
      return res
        .status(400)
        .json({
          message: "L'ID de l'utilisateur et l'ID de la compétence sont requis",
        });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur a des compétences requises
    if (!user.requiredSkills || !Array.isArray(user.requiredSkills)) {
      return res
        .status(404)
        .json({ message: "L'utilisateur n'a pas de compétences requises" });
    }

    // Trouver l'index de la compétence dans le tableau des compétences requises de l'utilisateur
    const skillIndex = user.requiredSkills.findIndex(
      (s) => s.skill.toString() === skillId
    );
    if (skillIndex === -1) {
      return res
        .status(404)
        .json({
          message: "L'utilisateur ne possède pas cette compétence requise",
        });
    }

    // Mettre à jour la compétence requise
    if (minimumLevel !== undefined) {
      user.requiredSkills[skillIndex].minimumLevel = minimumLevel;
    }

    await user.save();
    res.status(200).json({
      message: "Compétence requise de l'utilisateur mise à jour avec succès",
      user: {
        _id: user._id,
        username: user.username,
        requiredSkills: user.requiredSkills,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la compétence requise de l'utilisateur:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la mise à jour de la compétence requise de l'utilisateur",
      error: error.message,
    });
  }
};

// Supprimer une compétence requise d'un utilisateur
exports.removeRequiredSkillFromUser = async (req, res) => {
  try {
    const { userId, skillId } = req.params;

    if (!userId || !skillId) {
      return res
        .status(400)
        .json({
          message: "L'ID de l'utilisateur et l'ID de la compétence sont requis",
        });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur a des compétences requises
    if (!user.requiredSkills || !Array.isArray(user.requiredSkills)) {
      return res
        .status(404)
        .json({ message: "L'utilisateur n'a pas de compétences requises" });
    }

    // Vérifier si l'utilisateur a cette compétence requise
    const skillIndex = user.requiredSkills.findIndex(
      (s) => s.skill.toString() === skillId
    );
    if (skillIndex === -1) {
      return res
        .status(404)
        .json({
          message: "L'utilisateur ne possède pas cette compétence requise",
        });
    }

    // Supprimer la compétence requise
    user.requiredSkills.splice(skillIndex, 1);

    await user.save();
    res.status(200).json({
      message: "Compétence requise supprimée de l'utilisateur avec succès",
      user: {
        _id: user._id,
        username: user.username,
        requiredSkills: user.requiredSkills,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de la compétence requise de l'utilisateur:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la suppression de la compétence requise de l'utilisateur",
      error: error.message,
    });
  }
};
