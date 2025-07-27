import express from "express";
import {
  createChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createChat).get(protect, fetchChats);
router.post("/group", protect, createGroupChat);
router.put("/rename", protect, renameGroup);
router.put("/groupadd", protect, addToGroup);
router.put("/groupremove", protect, removeFromGroup);

export default router; 