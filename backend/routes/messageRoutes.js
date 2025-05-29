import express from "express";
import { sendMessage,getMessage,deleteMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/',protect,sendMessage);
router.get('/:chatId',protect,getMessage);
router.delete('/:id',protect,deleteMessage);

export default router;