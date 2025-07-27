import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

// @desc    Create or fetch one-on-one chat
// @route   POST /api/chat/
// @access  Private
const createChat = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "UserId param not sent with request" });
  }
  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user._id, userId] },
  }).populate("users", "-password").populate("latestMessage");
  if (chat) {
    return res.json(chat);
  }
  const chatData = {
    chatName: "sender",
    isGroupChat: false,
    users: [req.user._id, userId],
  };
  try {
    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findById(createdChat._id).populate("users", "-password");
    res.status(201).json(fullChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all chats for a user
// @route   GET /api/chat/
// @access  Private
const fetchChats = async (req, res) => {
  try {
    let chats = await Chat.find({ users: { $in: [req.user._id] } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });
    chats = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name email",
    });
    res.json(chats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create a group chat
// @route   POST /api/chat/group
// @access  Private
const createGroupChat = async (req, res) => {
  let { users, name } = req.body;
  if (!users || !name) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
  users = JSON.parse(users);
  if (users.length < 2) {
    return res.status(400).json({ message: "More than 2 users are required to form a group chat" });
  }
  users.push(req.user);
  try {
    const groupChat = await Chat.create({
      chatName: name,
      users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });
    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Rename group
// @route   PUT /api/chat/rename
// @access  Private
const renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;
  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
    if (!updatedChat) {
      return res.status(404).json({ message: "Chat Not Found" });
    }
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add user to group
// @route   PUT /api/chat/groupadd
// @access  Private
const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  try {
    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
    if (!added) {
      return res.status(404).json({ message: "Chat Not Found" });
    }
    res.json(added);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove user from group
// @route   PUT /api/chat/groupremove
// @access  Private
const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  try {
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
    if (!removed) {
      return res.status(404).json({ message: "Chat Not Found" });
    }
    res.json(removed);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { createChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup }; 