const User = require("../models/user");
const Task = require("../models/task");
const Project = require("../models/project");

/**
 * Service d'assignation automatique des tâches
 * Utilise un algorithme qui prend en compte :
 * - Les compétences requises pour la tâche
 * - Le niveau de compétence des membres
 * - La disponibilité des membres
 * - La charge de travail actuelle
 * - La date d'échéance du projet
 * - Les performances passées
 */
class TaskAssignmentService {
  /**
   * Trouve le meilleur membre pour une tâche donnée
   * @param {Object} task - La tâche à assigner
   * @param {String} projectId - L'ID du projet
   * @returns {Promise<Object>} - Le membre sélectionné et son score
   */
  static async findBestMemberForTask(task, projectId) {
    try {
      // Récupérer le projet pour obtenir la liste des membres
      const project = await Project.findById(projectId).populate(
        "members.user"
      );
      if (!project) {
        throw new Error("Projet non trouvé");
      }

      console.log("Projet trouvé:", project.name);
      console.log("Membres du projet:", project.members);

      // Vérifier si le projet a des membres
      if (!project.members || project.members.length === 0) {
        throw new Error("Le projet n'a pas de membres assignés");
      }

      // Récupérer tous les membres du projet
      // Gérer le cas où user pourrait être null
      const projectMembers = project.members
        .filter((member) => member.user) // Filtrer les membres avec user null
        .map((member) => member.user._id);

      console.log("IDs des membres du projet:", projectMembers);

      if (projectMembers.length === 0) {
        throw new Error("Aucun membre valide trouvé dans le projet");
      }

      // Récupérer les détails complets des membres avec leurs compétences et compétences requises
      const allMembers = await User.find({
        _id: { $in: projectMembers },
      })
        .populate("skills.skill")
        .populate("requiredSkills.skill");

      if (allMembers.length === 0) {
        throw new Error("Aucun membre disponible dans ce projet");
      }

      console.log(`Nombre total de membres trouvés: ${allMembers.length}`);

      // 1. Filtrer par rôle approprié (seulement les membres avec rôle "user")
      const membersByRole = allMembers.filter((member) => {
        const isAppropriateRole = member.role === "user";
        if (!isAppropriateRole) {
          console.log(
            `${member.username || member.email} exclu: rôle inapproprié (${
              member.role
            })`
          );
        }
        return isAppropriateRole;
      });

      console.log(`Membres après filtrage par rôle: ${membersByRole.length}`);

      if (membersByRole.length === 0) {
        throw new Error(
          "Aucun membre avec un rôle approprié trouvé dans ce projet"
        );
      }

      // 2. Vérifier les dépendances bloquantes
      const hasDependencies = task.dependencies && task.dependencies.length > 0;
      if (hasDependencies) {
        console.log(
          "La tâche a des dépendances, vérification de leur statut..."
        );
        const dependenciesCompleted = await this.checkDependenciesCompleted(
          task.dependencies
        );
        if (!dependenciesCompleted) {
          throw new Error(
            "Les tâches dont dépend celle-ci ne sont pas toutes terminées"
          );
        }
        console.log(
          "Toutes les dépendances sont terminées, la tâche peut être assignée"
        );
      }

      // 3. Filtrer par disponibilité suffisante
      const membersWithAvailability = membersByRole.filter((member) => {
        // Considérer qu'un membre est disponible si sa charge de travail est inférieure à 40h
        // ou si sa disponibilité est supérieure à 30%
        const workload = member.workload || 0;
        const availability =
          member.availability !== undefined ? member.availability : 100;

        const isAvailable = workload < 40 || availability > 30;

        if (!isAvailable) {
          console.log(
            `${
              member.username || member.email
            } exclu: disponibilité insuffisante (charge: ${workload}h, dispo: ${availability}%)`
          );
        }

        return isAvailable;
      });

      console.log(
        `Membres après filtrage par disponibilité: ${membersWithAvailability.length}`
      );

      if (membersWithAvailability.length === 0) {
        throw new Error(
          "Aucun membre avec une disponibilité suffisante trouvé"
        );
      }

      // 4. Filtrer par compétences requises pour le type de tâche
      const membersWithRequiredSkills = membersWithAvailability.filter(
        (member) => {
          // Vérifier si le membre a les compétences nécessaires pour le type de tâche
          const hasRequiredSkills = this.hasRequiredSkillsForTaskType(
            member,
            task
          );

          if (!hasRequiredSkills) {
            console.log(
              `${
                member.username || member.email
              } exclu: compétences insuffisantes pour le type de tâche ${
                task.taskType
              }`
            );
          }

          return hasRequiredSkills;
        }
      );

      console.log(
        `Membres après filtrage par compétences requises: ${membersWithRequiredSkills.length}`
      );

      // Si aucun membre ne possède les compétences requises, on utilise les membres disponibles
      const eligibleMembers =
        membersWithRequiredSkills.length > 0
          ? membersWithRequiredSkills
          : membersWithAvailability;

      // 5. Filtrer par niveau d'expérience approprié pour la complexité de la tâche
      const membersWithAppropriateExperience = eligibleMembers.filter(
        (member) => {
          // Vérifier si le niveau d'expérience du membre est approprié pour la complexité de la tâche
          const isExperienceAppropriate =
            this.isExperienceLevelAppropriateForComplexity(member, task);

          if (!isExperienceAppropriate) {
            console.log(
              `${
                member.username || member.email
              } exclu: niveau d'expérience inapproprié pour la complexité de la tâche`
            );
          }

          return isExperienceAppropriate;
        }
      );

      console.log(
        `Membres après filtrage par niveau d'expérience: ${membersWithAppropriateExperience.length}`
      );

      // Si aucun membre n'a le niveau d'expérience approprié, on utilise les membres éligibles
      const finalEligibleMembers =
        membersWithAppropriateExperience.length > 0
          ? membersWithAppropriateExperience
          : eligibleMembers;

      if (finalEligibleMembers.length === 0) {
        throw new Error(
          "Aucun membre éligible trouvé après application des filtres"
        );
      }

      // Calculer les scores pour chaque membre éligible
      const memberScores = await Promise.all(
        finalEligibleMembers.map(async (member) => {
          const score = await this.calculateMemberScore(member, task, project);
          return { member, score };
        })
      );

      // Trier par score décroissant
      memberScores.sort((a, b) => b.score - a.score);

      console.log("Scores des membres éligibles:");
      memberScores.forEach(({ member, score }) => {
        console.log(`${member.username || member.email}: ${score}`);
      });

      // Retourner le membre avec le score le plus élevé
      return memberScores[0];
    } catch (error) {
      console.error("Erreur lors de la recherche du meilleur membre:", error);
      throw error;
    }
  }

  /**
   * Calcule un score pour un membre en fonction de sa compatibilité avec la tâche
   * @param {Object} member - Le membre à évaluer
   * @param {Object} task - La tâche à assigner
   * @param {Object} project - Le projet associé
   * @returns {Promise<Number>} - Le score du membre (0-100)
   */
  static async calculateMemberScore(member, task, project) {
    try {
      // Initialiser le score de base
      let score = 50; // Score de base moyen

      // 1. Évaluer les compétences (poids: 35%) - Priorité la plus élevée
      const skillScore = this.evaluateSkills(member, task);
      console.log("Score des compétences:", skillScore);
      score += skillScore * 0.35;

      // 2. Évaluer le niveau d'expérience (poids: 20%) - Augmenté pour donner plus d'importance à l'expérience
      const experienceLevelScore = this.evaluateExperienceLevel(member, task);
      console.log("Score du niveau d'expérience:", experienceLevelScore);
      score += experienceLevelScore * 0.2;

      // 3. Évaluer la disponibilité et la charge de travail (poids: 20%) - Inchangé
      const workloadScore = this.evaluateWorkload(member);
      console.log("Score de charge de travail:", workloadScore);
      score += workloadScore * 0.2;

      // 4. Évaluer les performances passées (poids: 15%) - Inchangé
      // Utiliser une valeur par défaut de 3 si performanceRating n'est pas défini
      const performanceRating = member.performanceRating || 3;
      const performanceScore = performanceRating * 20; // 1-5 -> 20-100
      console.log(
        "Performance rating:",
        performanceRating,
        "Score:",
        performanceScore
      );

      // Donner plus de poids aux performances pour les tâches complexes ou urgentes
      let performanceWeight = 0.15;
      if (task.complexity && task.complexity >= 7) {
        performanceWeight = 0.2; // Augmenter le poids pour les tâches complexes
        console.log(
          "Poids des performances augmenté pour tâche complexe:",
          performanceWeight
        );
      }

      score += performanceScore * performanceWeight;

      // 5. Évaluer l'urgence par rapport à la date d'échéance (poids: 10%) - Inchangé
      const urgencyScore = this.evaluateUrgency(task, project);
      console.log("Score d'urgence:", urgencyScore);
      score += urgencyScore * 0.1;

      // 6. Appliquer des pénalités ou bonus supplémentaires

      // Pénalité si le membre n'a pas les compétences requises pour le type de tâche
      if (!this.hasRequiredSkillsForTaskType(member, task)) {
        const penalty = -20;
        console.log("Pénalité pour compétences insuffisantes:", penalty);
        score += penalty;
      }

      // Pénalité si le niveau d'expérience n'est pas approprié pour la complexité de la tâche
      if (!this.isExperienceLevelAppropriateForComplexity(member, task)) {
        const penalty = -15;
        console.log("Pénalité pour niveau d'expérience inapproprié:", penalty);
        score += penalty;
      }

      // Bonus pour les membres ayant une bonne performance et assignés à des tâches urgentes
      if (task.dueDate) {
        const now = new Date();
        const dueDate = new Date(task.dueDate);
        const daysUntilDue = Math.max(
          0,
          (dueDate - now) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDue <= 3 && performanceRating >= 4) {
          const bonus = 10;
          console.log("Bonus pour bonne performance sur tâche urgente:", bonus);
          score += bonus;
        }
      }

      console.log("Score final du membre:", Math.min(100, Math.max(0, score)));

      // Limiter le score entre 0 et 100
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error("Erreur lors du calcul du score du membre:", error);
      return 0; // Score minimal en cas d'erreur
    }
  }

  /**
   * Évalue les compétences d'un membre par rapport au type de tâche et à ses compétences requises
   * @param {Object} member - Le membre à évaluer
   * @param {Object} task - La tâche à assigner
   * @returns {Number} - Le score de compétence (0-100)
   */
  static evaluateSkills(member, task) {
    console.log(
      "Évaluation des compétences pour le membre:",
      member.username || member.email
    );
    console.log("Type de tâche:", task.taskType || "non spécifié");

    // Vérifier si le membre a des compétences
    if (
      !member.skills ||
      !Array.isArray(member.skills) ||
      member.skills.length === 0
    ) {
      console.log(
        "Le membre n'a pas de compétences définies, score faible attribué"
      );
      return 30; // Score faible si le membre n'a pas de compétences
    }

    // Définir les compétences importantes pour chaque type de tâche
    const taskTypeSkillMapping = {
      development: [
        "JavaScript",
        "React",
        "Node.js",
        "MongoDB",
        "Express",
        "TypeScript",
        "API",
        "Backend",
        "Frontend",
      ],
      design: [
        "UI/UX Design",
        "Figma",
        "Adobe XD",
        "CSS",
        "HTML",
        "Design",
        "Photoshop",
        "Illustrator",
      ],
      testing: [
        "Testing",
        "QA",
        "Jest",
        "Cypress",
        "Selenium",
        "Test unitaire",
        "Test d'intégration",
      ],
      documentation: [
        "Documentation",
        "Markdown",
        "Technical Writing",
        "UML",
        "Diagramme",
      ],
      "bug-fix": [
        "Debugging",
        "Testing",
        "JavaScript",
        "React",
        "Node.js",
        "Backend",
        "Frontend",
      ],
      feature: [
        "JavaScript",
        "React",
        "Node.js",
        "MongoDB",
        "Express",
        "Frontend",
        "Backend",
      ],
      maintenance: [
        "DevOps",
        "CI/CD",
        "Docker",
        "Kubernetes",
        "AWS",
        "Azure",
        "Git",
      ],
      other: [], // Pas de compétences spécifiques pour le type "other"
    };

    // Obtenir les compétences importantes pour ce type de tâche
    const importantSkillNames = taskTypeSkillMapping[task.taskType] || [];
    console.log(
      "Compétences importantes pour ce type de tâche:",
      importantSkillNames
    );

    // Calculer le score de base en fonction des compétences requises du membre
    let requiredSkillsScore = 0;
    let matchedRequiredSkills = 0;

    // Vérifier si le membre a des compétences requises
    if (
      member.requiredSkills &&
      Array.isArray(member.requiredSkills) &&
      member.requiredSkills.length > 0
    ) {
      console.log("Compétences requises du membre:", member.requiredSkills);
      console.log("Compétences actuelles du membre:", member.skills);

      // Pour chaque compétence requise du membre
      member.requiredSkills.forEach((requiredSkill) => {
        if (!requiredSkill.skill) {
          console.log("Compétence requise invalide (pas d'ID de compétence)");
          return; // Passer à la compétence suivante
        }

        // Convertir en string pour la comparaison
        const requiredSkillId = requiredSkill.skill._id
          ? requiredSkill.skill._id.toString()
          : requiredSkill.skill.toString();
        const requiredSkillName =
          requiredSkill.skill.name || "Compétence inconnue";
        console.log(
          "Vérification de la compétence requise:",
          requiredSkillName
        );

        // Bonus si la compétence requise est importante pour ce type de tâche
        const isImportantForTaskType = importantSkillNames.some((name) =>
          requiredSkillName.toLowerCase().includes(name.toLowerCase())
        );
        const taskTypeBonus = isImportantForTaskType ? 20 : 0;
        console.log(
          `Compétence ${requiredSkillName} importante pour ce type de tâche: ${
            isImportantForTaskType ? "Oui (+20)" : "Non (+0)"
          }`
        );

        // Chercher si le membre possède cette compétence
        const memberSkill = member.skills.find((s) => {
          // Vérifier que s.skill existe et a un _id
          if (!s.skill || !s.skill._id) {
            console.log("Compétence du membre invalide:", s);
            return false;
          }
          return s.skill._id.toString() === requiredSkillId;
        });

        if (memberSkill) {
          matchedRequiredSkills++;
          console.log("Compétence trouvée chez le membre:", memberSkill);

          // Calculer le score en fonction du niveau de compétence
          const levelDifference =
            memberSkill.proficiencyLevel - (requiredSkill.minimumLevel || 1);
          console.log("Différence de niveau:", levelDifference);

          let skillScore = 0;
          if (levelDifference >= 2) {
            // Bien au-dessus du niveau requis
            skillScore = 100;
            console.log(
              "Score de base pour cette compétence: 100 (bien au-dessus)"
            );
          } else if (levelDifference === 1) {
            // Juste au-dessus du niveau requis
            skillScore = 80;
            console.log(
              "Score de base pour cette compétence: 80 (juste au-dessus)"
            );
          } else if (levelDifference === 0) {
            // Au niveau requis exact
            skillScore = 60;
            console.log(
              "Score de base pour cette compétence: 60 (niveau exact)"
            );
          } else {
            // En dessous du niveau requis
            skillScore = 30;
            console.log("Score de base pour cette compétence: 30 (en dessous)");
          }

          // Ajouter le bonus pour le type de tâche
          skillScore += taskTypeBonus;
          console.log(
            `Score final pour cette compétence: ${skillScore} (avec bonus de type de tâche)`
          );

          requiredSkillsScore += skillScore;
        } else {
          console.log("Compétence non trouvée chez le membre");
        }
      });
    } else {
      console.log("Le membre n'a pas de compétences requises définies");
    }

    // Calculer le score pour les compétences importantes pour ce type de tâche
    let taskTypeSkillsScore = 0;
    let matchedTaskTypeSkills = 0;

    // Pour chaque compétence du membre, vérifier si elle est importante pour ce type de tâche
    if (importantSkillNames.length > 0) {
      member.skills.forEach((memberSkill) => {
        if (!memberSkill.skill || !memberSkill.skill.name) {
          console.log("Compétence du membre invalide (pas de nom)");
          return; // Passer à la compétence suivante
        }

        const skillName = memberSkill.skill.name;
        const isImportantForTaskType = importantSkillNames.some((name) =>
          skillName.toLowerCase().includes(name.toLowerCase())
        );

        if (isImportantForTaskType) {
          matchedTaskTypeSkills++;
          console.log(
            `Compétence ${skillName} importante pour ce type de tâche trouvée chez le membre`
          );

          // Le score dépend du niveau de compétence (1-5 -> 20-100)
          const skillScore = memberSkill.proficiencyLevel * 20;
          console.log(
            `Score pour cette compétence: ${skillScore} (niveau ${memberSkill.proficiencyLevel})`
          );

          taskTypeSkillsScore += skillScore;
        }
      });
    }

    // Calculer les scores moyens
    const avgRequiredSkillsScore =
      matchedRequiredSkills > 0
        ? requiredSkillsScore / matchedRequiredSkills
        : 0;
    const avgTaskTypeSkillsScore =
      matchedTaskTypeSkills > 0
        ? taskTypeSkillsScore / matchedTaskTypeSkills
        : 0;

    console.log(
      "Score moyen des compétences requises:",
      avgRequiredSkillsScore
    );
    console.log(
      "Score moyen des compétences importantes pour ce type de tâche:",
      avgTaskTypeSkillsScore
    );

    // Combiner les scores (60% compétences requises, 40% compétences importantes pour le type de tâche)
    let finalScore = 0;

    if (matchedRequiredSkills > 0 && matchedTaskTypeSkills > 0) {
      // Si le membre a à la fois des compétences requises et des compétences importantes pour le type de tâche
      finalScore = avgRequiredSkillsScore * 0.6 + avgTaskTypeSkillsScore * 0.4;
    } else if (matchedRequiredSkills > 0) {
      // Si le membre a seulement des compétences requises
      finalScore = avgRequiredSkillsScore * 0.8; // Réduire légèrement le score
    } else if (matchedTaskTypeSkills > 0) {
      // Si le membre a seulement des compétences importantes pour le type de tâche
      finalScore = avgTaskTypeSkillsScore * 0.7; // Réduire davantage le score
    } else {
      // Si le membre n'a ni compétences requises ni compétences importantes pour le type de tâche
      finalScore = 20; // Score faible mais pas zéro
    }

    console.log("Score final des compétences:", finalScore);
    return finalScore;
  }

  /**
   * Évalue le niveau d'expérience d'un membre par rapport au type de tâche
   * @param {Object} member - Le membre à évaluer
   * @param {Object} task - La tâche à assigner
   * @returns {Number} - Le score de niveau d'expérience (0-100)
   */
  static evaluateExperienceLevel(member, task) {
    console.log(
      "Évaluation du niveau d'expérience pour le membre:",
      member.username || member.email
    );

    // Récupérer le niveau d'expérience du membre (valeur par défaut: mid-level)
    const experienceLevel = member.experienceLevel || "mid-level";
    console.log("Niveau d'expérience:", experienceLevel);

    // Définir les scores de base pour chaque niveau d'expérience
    const experienceLevelScores = {
      intern: 30, // Stagiaire
      junior: 50, // Junior
      "mid-level": 70, // Intermédiaire
      senior: 85, // Senior
      expert: 95, // Expert
      lead: 100, // Lead
    };

    // Obtenir le score de base pour le niveau d'expérience
    const baseScore = experienceLevelScores[experienceLevel] || 70;
    console.log("Score de base pour le niveau d'expérience:", baseScore);

    // Ajuster le score en fonction du type de tâche et de la complexité
    let adjustedScore = baseScore;

    // Ajustement en fonction du type de tâche
    if (task.taskType) {
      // Les tâches de développement et de bug-fix sont plus adaptées aux niveaux intermédiaires et supérieurs
      if (
        (task.taskType === "development" || task.taskType === "bug-fix") &&
        (experienceLevel === "intern" || experienceLevel === "junior")
      ) {
        adjustedScore -= 10;
        console.log("Ajustement pour tâche de développement/bug-fix (-10)");
      }

      // Les tâches de documentation sont adaptées à tous les niveaux
      if (task.taskType === "documentation") {
        adjustedScore += 5;
        console.log("Ajustement pour tâche de documentation (+5)");
      }

      // Les tâches de maintenance sont plus adaptées aux niveaux intermédiaires et supérieurs
      if (
        task.taskType === "maintenance" &&
        (experienceLevel === "intern" || experienceLevel === "junior")
      ) {
        adjustedScore -= 15;
        console.log("Ajustement pour tâche de maintenance (-15)");
      }

      // Les tâches de design sont plus adaptées aux niveaux intermédiaires et supérieurs
      if (task.taskType === "design" && experienceLevel === "intern") {
        adjustedScore -= 10;
        console.log("Ajustement pour tâche de design (-10)");
      }
    }

    // Ajustement en fonction de la complexité de la tâche
    if (task.complexity) {
      // Pour les tâches très complexes (8-10), favoriser les niveaux supérieurs
      if (task.complexity >= 8) {
        if (experienceLevel === "intern") {
          adjustedScore -= 30;
          console.log("Ajustement pour tâche très complexe (stagiaire: -30)");
        } else if (experienceLevel === "junior") {
          adjustedScore -= 20;
          console.log("Ajustement pour tâche très complexe (junior: -20)");
        } else if (experienceLevel === "mid-level") {
          adjustedScore -= 10;
          console.log(
            "Ajustement pour tâche très complexe (intermédiaire: -10)"
          );
        } else if (
          experienceLevel === "senior" ||
          experienceLevel === "expert" ||
          experienceLevel === "lead"
        ) {
          adjustedScore += 10;
          console.log(
            "Ajustement pour tâche très complexe (senior/expert/lead: +10)"
          );
        }
      }
      // Pour les tâches moyennement complexes (5-7), favoriser les niveaux intermédiaires et supérieurs
      else if (task.complexity >= 5) {
        if (experienceLevel === "intern") {
          adjustedScore -= 20;
          console.log(
            "Ajustement pour tâche moyennement complexe (stagiaire: -20)"
          );
        } else if (experienceLevel === "junior") {
          adjustedScore -= 10;
          console.log(
            "Ajustement pour tâche moyennement complexe (junior: -10)"
          );
        }
      }
      // Pour les tâches peu complexes (1-4), tous les niveaux sont adaptés
      else {
        if (experienceLevel === "intern" || experienceLevel === "junior") {
          adjustedScore += 10;
          console.log(
            "Ajustement pour tâche peu complexe (stagiaire/junior: +10)"
          );
        }
      }
    }

    // Limiter le score entre 0 et 100
    const finalScore = Math.min(100, Math.max(0, adjustedScore));
    console.log("Score final du niveau d'expérience:", finalScore);

    return finalScore;
  }

  /**
   * Évalue la disponibilité et la charge de travail d'un membre
   * @param {Object} member - Le membre à évaluer
   * @returns {Number} - Le score de disponibilité (0-100)
   */
  static evaluateWorkload(member) {
    console.log(
      "Évaluation de la charge de travail pour le membre:",
      member.username || member.email
    );

    // Convertir la disponibilité en score (0-100%)
    // Utiliser 100% comme valeur par défaut si availability n'est pas défini
    const availabilityScore =
      member.availability !== undefined ? member.availability : 100;
    console.log("Disponibilité:", availabilityScore);

    // Calculer un score inversement proportionnel à la charge de travail
    // Plus la charge est élevée, plus le score est bas
    // Utiliser 0 comme valeur par défaut si workload n'est pas défini
    const workload = member.workload || 0;
    const workloadFactor = Math.max(0, 100 - (workload / 40) * 100);
    console.log("Charge de travail:", workload, "Facteur:", workloadFactor);

    // Combiner les deux scores
    const finalScore = (availabilityScore + workloadFactor) / 2;
    console.log("Score final de charge de travail:", finalScore);

    return finalScore;
  }

  /**
   * Évalue l'urgence de la tâche par rapport à la date d'échéance du projet
   * @param {Object} task - La tâche à assigner
   * @param {Object} project - Le projet associé
   * @returns {Number} - Le score d'urgence (0-100)
   */
  static evaluateUrgency(task, project) {
    // Vérifier si la tâche a une date d'échéance
    if (!task.dueDate) {
      console.log("La tâche n'a pas de date d'échéance, score d'urgence moyen");
      return 50; // Score moyen si pas de date d'échéance pour la tâche
    }

    // Vérifier si le projet a une date d'échéance (deadline)
    // Dans le modèle de projet, la date d'échéance est stockée dans le champ 'deadline'
    if (!project.deadline) {
      console.log(
        "Le projet n'a pas de date d'échéance, utilisation de la date de la tâche uniquement"
      );
      // Si le projet n'a pas de deadline, on utilise uniquement la date d'échéance de la tâche
      const now = new Date();
      const taskDueDate = new Date(task.dueDate);

      // Si la date d'échéance est dépassée
      if (taskDueDate < now) {
        return 100; // Urgence maximale
      }

      // Calculer l'urgence en fonction du temps restant (plus c'est proche, plus c'est urgent)
      const daysRemaining = Math.max(
        0,
        (taskDueDate - now) / (1000 * 60 * 60 * 24)
      );
      return Math.max(20, 100 - daysRemaining * 5); // 20 est le score minimum
    }

    const now = new Date();
    const taskDueDate = new Date(task.dueDate);
    const projectDeadline = new Date(project.deadline);

    // Si la date d'échéance de la tâche est dépassée
    if (taskDueDate < now) {
      return 100; // Urgence maximale
    }

    // Si la date d'échéance de la tâche est après la date d'échéance du projet
    if (taskDueDate > projectDeadline) {
      return 30; // Faible urgence, mais potentiellement problématique
    }

    // Calculer le pourcentage de temps restant jusqu'à l'échéance de la tâche
    const totalTaskDuration = taskDueDate - now;
    const remainingTime = taskDueDate - now;
    const timePercentage = remainingTime / totalTaskDuration;

    // Convertir en score d'urgence (moins de temps = plus urgent)
    return 100 - timePercentage * 100;
  }

  /**
   * Vérifie si toutes les tâches dont dépend la tâche actuelle sont terminées
   * @param {Array} dependencies - Liste des IDs des tâches dont dépend la tâche actuelle
   * @returns {Promise<Boolean>} - True si toutes les dépendances sont terminées, false sinon
   */
  static async checkDependenciesCompleted(dependencies) {
    try {
      if (!dependencies || dependencies.length === 0) {
        return true; // Pas de dépendances, donc considéré comme complété
      }

      // Récupérer toutes les tâches dont dépend la tâche actuelle
      const dependentTasks = await Task.find({
        _id: { $in: dependencies },
      });

      console.log(
        `Nombre de tâches dépendantes trouvées: ${dependentTasks.length}`
      );

      // Vérifier si toutes les tâches dépendantes sont terminées
      const allCompleted = dependentTasks.every(
        (task) => task.status === "completed"
      );

      if (!allCompleted) {
        const incompleteTasks = dependentTasks
          .filter((task) => task.status !== "completed")
          .map((task) => task.title || task._id);

        console.log(
          `Tâches dépendantes non terminées: ${incompleteTasks.join(", ")}`
        );
      }

      return allCompleted;
    } catch (error) {
      console.error("Erreur lors de la vérification des dépendances:", error);
      return false; // En cas d'erreur, considérer que les dépendances ne sont pas terminées
    }
  }

  /**
   * Vérifie si un membre possède les compétences requises pour le type de tâche
   * @param {Object} member - Le membre à évaluer
   * @param {Object} task - La tâche à assigner
   * @returns {Boolean} - True si le membre possède les compétences requises, false sinon
   */
  static hasRequiredSkillsForTaskType(member, task) {
    // Si la tâche n'a pas de type défini, on considère que le membre est qualifié
    if (!task.taskType) {
      return true;
    }

    // Définir les compétences importantes pour chaque type de tâche
    const taskTypeSkillMapping = {
      development: [
        "JavaScript",
        "React",
        "Node.js",
        "MongoDB",
        "Express",
        "TypeScript",
        "API",
        "Backend",
        "Frontend",
      ],
      design: [
        "UI/UX Design",
        "Figma",
        "Adobe XD",
        "CSS",
        "HTML",
        "Design",
        "Photoshop",
        "Illustrator",
      ],
      testing: [
        "Testing",
        "QA",
        "Jest",
        "Cypress",
        "Selenium",
        "Test unitaire",
        "Test d'intégration",
      ],
      documentation: [
        "Documentation",
        "Markdown",
        "Technical Writing",
        "UML",
        "Diagramme",
      ],
      "bug-fix": [
        "Debugging",
        "Testing",
        "JavaScript",
        "React",
        "Node.js",
        "Backend",
        "Frontend",
      ],
      feature: [
        "JavaScript",
        "React",
        "Node.js",
        "MongoDB",
        "Express",
        "Frontend",
        "Backend",
      ],
      maintenance: [
        "DevOps",
        "CI/CD",
        "Docker",
        "Kubernetes",
        "AWS",
        "Azure",
        "Git",
      ],
      JAVA: ["Java", "Spring", "Hibernate", "JPA", "Maven", "JUnit"],
      other: [], // Pas de compétences spécifiques pour le type "other"
    };

    // Obtenir les compétences importantes pour ce type de tâche
    const importantSkillNames = taskTypeSkillMapping[task.taskType] || [];

    // Si aucune compétence importante n'est définie pour ce type de tâche, on considère que le membre est qualifié
    if (importantSkillNames.length === 0) {
      return true;
    }

    // Vérifier si le membre a des compétences
    if (
      !member.skills ||
      !Array.isArray(member.skills) ||
      member.skills.length === 0
    ) {
      return false;
    }

    // Vérifier si le membre possède au moins une des compétences importantes pour ce type de tâche
    // avec un niveau de compétence suffisant (>= 3)
    const hasRequiredSkill = member.skills.some((memberSkill) => {
      if (!memberSkill.skill || !memberSkill.skill.name) {
        return false;
      }

      const skillName = memberSkill.skill.name;
      const isImportantForTaskType = importantSkillNames.some((name) =>
        skillName.toLowerCase().includes(name.toLowerCase())
      );

      // Vérifier si la compétence est importante et si le niveau est suffisant
      return isImportantForTaskType && memberSkill.proficiencyLevel >= 3;
    });

    return hasRequiredSkill;
  }

  /**
   * Vérifie si le niveau d'expérience d'un membre est approprié pour la complexité de la tâche
   * @param {Object} member - Le membre à évaluer
   * @param {Object} task - La tâche à assigner
   * @returns {Boolean} - True si le niveau d'expérience est approprié, false sinon
   */
  static isExperienceLevelAppropriateForComplexity(member, task) {
    // Si la tâche n'a pas de complexité définie, on considère que le membre est qualifié
    if (!task.complexity) {
      return true;
    }

    // Récupérer le niveau d'expérience du membre (valeur par défaut: mid-level)
    const experienceLevel = member.experienceLevel || "mid-level";

    // Définir les niveaux de complexité appropriés pour chaque niveau d'expérience
    const appropriateComplexityLevels = {
      intern: [1, 2, 3], // Les stagiaires peuvent gérer des tâches de complexité 1-3
      junior: [1, 2, 3, 4, 5], // Les juniors peuvent gérer des tâches de complexité 1-5
      "mid-level": [1, 2, 3, 4, 5, 6, 7], // Les intermédiaires peuvent gérer des tâches de complexité 1-7
      senior: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Les seniors peuvent gérer des tâches de complexité 1-9
      expert: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Les experts peuvent gérer des tâches de toute complexité
      lead: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Les leads peuvent gérer des tâches de toute complexité
    };

    // Obtenir les niveaux de complexité appropriés pour ce niveau d'expérience
    const appropriateLevels = appropriateComplexityLevels[experienceLevel] || [
      1, 2, 3, 4, 5, 6, 7,
    ];

    // Vérifier si la complexité de la tâche est appropriée pour le niveau d'expérience du membre
    return appropriateLevels.includes(task.complexity);
  }

  /**
   * Assigne automatiquement une tâche au meilleur membre disponible
   * @param {Object} task - La tâche à assigner
   * @param {String} projectId - L'ID du projet
   * @returns {Promise<Object>} - La tâche mise à jour avec le membre assigné
   */
  static async autoAssignTask(task, projectId) {
    try {
      const { member, score } = await this.findBestMemberForTask(
        task,
        projectId
      );

      if (!member) {
        throw new Error("Aucun membre approprié trouvé pour cette tâche");
      }

      // Mettre à jour la tâche avec le membre assigné
      task.assignedTo = member._id;
      task.autoAssigned = true;

      // Mettre à jour la charge de travail du membre
      member.workload += task.estimatedHours || 8;
      await member.save();

      // Sauvegarder la tâche mise à jour
      await task.save();

      return {
        task,
        member: {
          _id: member._id,
          username: member.username,
          firstName: member.firstName,
          lastName: member.lastName,
        },
        score,
      };
    } catch (error) {
      console.error(
        "Erreur lors de l'assignation automatique de la tâche:",
        error
      );
      throw error;
    }
  }
}

module.exports = TaskAssignmentService;
