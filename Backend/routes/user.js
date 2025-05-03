const userController = require("../controllers/userController");
const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const admin_router = express.Router();

admin_router.get("/showuser", userController.showuser);
admin_router.get("/showByid/:id", userController.showByid);
admin_router.put("/update/:id", userController.update);
admin_router.delete("/deleteuser/:id", userController.deleteuser);
admin_router.post("/add", userController.add);
admin_router.get("/check-email", userController.checkEmail);

// Route pour télécharger une image de profil
admin_router.post(
  "/upload-avatar/:id",
  upload.single("avatar"),
  userController.uploadAvatar
);

module.exports = admin_router;
