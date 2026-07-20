import { Router } from "express";
import { register, login, refreshToken, forgotPassword, logout } from "./auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/logout", logout);

export default router;
