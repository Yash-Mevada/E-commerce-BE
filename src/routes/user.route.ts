import { Router } from "express";
import authController from "../controllers/AuthController/auth.controller.js";
import userController from "../controllers/UserController/user.controller.js";


const router = Router();

router.post("/create", authController.createUserController.bind(authController));
router.post("/login", authController.loginUserController.bind(authController));
router.post("/alluser", authController.isAuthUser.bind(authController), userController.getAllUsers.bind(userController))
router.get("/profile", authController.isAuthUser.bind(authController), userController.getUserProfile.bind(userController))
router.put("/update", authController.isAuthUser.bind(authController), userController.updateUser.bind(userController))

export default router;