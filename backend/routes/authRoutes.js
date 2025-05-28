import express from "express";
import { registerUser,loginUser } from "../controllers/userController.js";
import { validateRegister,hashPassword,protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/register',
    validateRegister,
    hashPassword,
    registerUser
);
router.post('/login',loginUser);
router.get('/profile',protect,(req,res)=>{
    res.json(req.user);
})
export default router;