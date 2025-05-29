import { accessChat,fetchChat,createGroupChat,renameGroup,removeFromGroup,addToGroup,deleteGroupChat } from "../controllers/chatController.js";

import express from 'express';
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router()

router.post('/access',protect,accessChat);
router.get('/',protect,fetchChat);
router.post('/group',protect,createGroupChat);
router.post('/access',protect,accessChat);
router.put('/rename',protect,renameGroup);
router.put('/groupadd',protect,addToGroup);
router.put('/groupremove',protect,removeFromGroup);
router.delete('/groupdelete',protect,deleteGroupChat);

export default router;