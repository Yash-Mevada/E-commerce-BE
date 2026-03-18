import { Router } from "express";
import authController from "../controllers/AuthController/auth.controller.js";
import userController from "../controllers/UserController/user.controller.js";
import { asynWrapper } from "../utils/asyncWrapper.js";


const router = Router();

router.post("/create", asynWrapper(authController.createUserController.bind(authController)));
router.post("/login", asynWrapper(authController.loginUserController.bind(authController)));
router.post("/alluser", asynWrapper(authController.isAuthUser.bind(authController)), asynWrapper(userController.getAllUsers.bind(userController)))
router.get("/profile", asynWrapper(authController.isAuthUser.bind(authController)), asynWrapper(userController.getUserProfile.bind(userController)))
router.put("/update", asynWrapper(authController.isAuthUser.bind(authController)), asynWrapper(userController.updateUser.bind(userController)))
router.put("/forgot-password", asynWrapper(authController.isAuthUser.bind(authController)), asynWrapper(authController.forgotpassword.bind(authController)))
router.put("/reset-password", asynWrapper(authController.isAuthUser.bind(authController)), asynWrapper(authController.resetPassword.bind(authController)))
router.delete("/delete/:id", asynWrapper(authController.isAuthUser.bind(authController)), asynWrapper(userController.deleteUser.bind(userController)))

export default router;