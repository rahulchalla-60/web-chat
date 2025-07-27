import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";

// @desc    Send a message
// @route   POST /api/message/
// @access  Private
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;
  if (!content || !chatId) {
    return res.status(400).json({ message: "Invalid data passed into request" });
  }
  let newMessage = {
    sender: req.user._id,
    content,
    chat: chatId,
  };
  try {
    let message = await Message.create(newMessage);
    message = await message.populate("sender", "name email");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name email",
    });
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Fetch all messages for a chat
// @route   GET /api/message/:chatId
// @access  Private
const fetchMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { sendMessage, fetchMessages }; 