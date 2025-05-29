import Chat from "../models/Chat.js";
import User from "../models/User.js";

export const accessChat = async (req,res)=>{
    const {userId} = req.body;
    const loggedInUserId = req.user._id;

    if (!userId){
        return res.status(400).json({message:"userId not sent with the request body"});
    }
    try{
        let chat = await Chat.findOne({
            isGroupChat : false,
            users: { $all: [loggedInUserId, userId] },
        }).populate("users","-password").populate("latestMessage");
        if(chat){
            res.status(200).json(chat);
        }
        //if no chat create a new chat
        const newChat = await Chat.create({
            chatname : "Direct chat",
            isGroupChat : false,
            users : [loggedInUserId,userId]
        });
        const fullChat = await Chat.findById(newChat._id).populate("users","-password");
        res.status(201).json(fullChat);
    }
    catch(err){
        res.status(400).json({message : "error accessing chat",err });
    }
};

export const fetchChat = async (req,res)=>{
    try{
        const {loggedInUserId} = req.user._id;
        const chats = await Chat.find({users : loggedInUserId}).populate("users","-passwords")
        .populate("latestMessage").sort({uploadedAt : -1});
        res.status(200).json(chats);
    }
    catch(err){
        res.status(400).json({message : "failed to fetch chats",err});
    }
};

// Create group chat
export const createGroupChat = async (req, res) => {
  const { users, name } = req.body;
  if (!users || !name) {
    return res.status(400).json({ message: "Users and group name are required" });
  }

  let usersArray = JSON.parse(users); // Expecting users as JSON stringified array of user IDs

  if (usersArray.length < 2) {
    return res.status(400).json({ message: "At least 2 users required to form a group chat" });
  }

  usersArray.push(req.user._id); // Add current user to the group as well

  try {
    const groupChat = await Chat.create({
      chatname: name,
      users: usersArray,
      isGroupChat: true,
    });

    const fullGroupChat = await Chat.findById(groupChat._id).populate("users", "-password");
    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: "Failed to create group chat", error });
  }
};


// Rename group chat
export const renameGroup = async (req, res) => {
  const { chatId, chatname } = req.body;
  if (!chatId || !chatname) {
    return res.status(400).json({ message: "chatId and chatname required" });
  }

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatname },
      { new: true }
    ).populate("users", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: "Failed to rename group", error });
  }
};


// Add user to group chat
export const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    return res.status(400).json({ message: "chatId and userId required" });
  }

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    ).populate("users", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: "Failed to add user to group", error });
  }
};

// Remove user from group chat
export const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    return res.status(400).json({ message: "chatId and userId required" });
  }

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    ).populate("users", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: "Failed to remove user from group", error });
  }
};

// Delete group chat (optional: only group chats, maybe check for admin)
export const deleteGroupChat = async (req, res) => {
  const { chatId } = req.body;
  if (!chatId) {
    return res.status(400).json({ message: "chatId required" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: "Cannot delete a one-to-one chat" });
    }

    await Chat.findByIdAndDelete(chatId);
    res.status(200).json({ message: "Group chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete group chat", error });
  }
};