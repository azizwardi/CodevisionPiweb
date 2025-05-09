const express = require("express");
const {
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  addSkillToUser,
  updateUserSkill,
  removeSkillFromUser,
  getUserSkills,
  getUserRequiredSkills,
  addRequiredSkillToUser,
  updateUserRequiredSkill,
  removeRequiredSkillFromUser,
} = require("../controllers/skillController");

const router = express.Router();

// Routes pour les compétences
router.get("/", getAllSkills);
router.get("/:skillId", getSkillById);
router.post("/", createSkill);
router.put("/:skillId", updateSkill);
router.delete("/:skillId", deleteSkill);

// Routes pour les compétences requises des utilisateurs (plus spécifiques d'abord)
router.post("/user/required", addRequiredSkillToUser);
router.put("/user/required", updateUserRequiredSkill);
router.delete("/user/required/:userId/:skillId", removeRequiredSkillFromUser);
router.get("/user/required/:userId", getUserRequiredSkills);

// Routes pour les compétences des utilisateurs (plus génériques ensuite)
router.post("/user", addSkillToUser);
router.put("/user", updateUserSkill);
router.delete("/user/:userId/:skillId", removeSkillFromUser);
router.get("/user/:userId", getUserSkills);

module.exports = router;
