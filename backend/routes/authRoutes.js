import express from "express";
import { registerUser } from "../controllers/userController.js";
import { validateRegister,hashPassword } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/register',
    validateRegister,
    hashPassword,
    registerUser
);

export default router;