const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const { authenticateUser, checkRole } = require("../Middlewares/authMiddleware");

router.get("/users", authenticateUser, checkRole(["admin"]), UserController.getAllUsers);
router.post("/create-user", authenticateUser, checkRole(["admin", "TeamLeader"]), UserController.createUser);


module.exports = router;
