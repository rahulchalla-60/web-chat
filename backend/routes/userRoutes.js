import express from 'express';
import { getAllUsers, getAuthUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get('/me', protect, getAuthUser);
router.get('/', protect, getAllUsers); // GET /api/users — returns all users except self

export default router;