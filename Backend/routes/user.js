const userController = require("../controller/userController");
const express = require("express");
const admin_router = express.Router();


admin_router.get("/showuser", userController.showuser);
admin_router.get("/showByid/:id", userController.showByid);
admin_router.put("/update/:id", userController.update);
admin_router.delete("/deleteuser/:id", userController.deleteuser);
admin_router.post("/add", userController.add);


module.exports = admin_router;