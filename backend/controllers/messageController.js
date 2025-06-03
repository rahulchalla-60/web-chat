import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
export const sendMessage = async(req,res)=>{
    const {content , chat} = req.body;
    if(!content || !chat){
        return res.status(400).json({message : "Content and chat id are required"});
    }
    try{
        const chats = await Chat.find({});
        console.log(chats);
        const newMessage = await Message.create({
            sender : req.user._id,
            content,
            chat
        });
        const fullMessage = await newMessage.populate("sender", "name email").populate("chat");
        res.status(201).json(fullMessage);

    }
    catch(err){
        res.status(400).json({message:"failed to send message"});
    }
};

export const getMessage = async(req,res)=>{
    const {chatId} = req.params;
    try{
        const messages = await Message.find({chat : chatId}).populate("sender","name email").sort({createdAt : 1});
        res.status(200).json(messages);
    }
    catch(err){
        res.status(500).json({message : "Failed to get message"});
    }
};

export const deleteMessage = async(req,res)=>{
    const messageId = req.params.id;
    try{
        const message = await Message.findById(messageId);
        if(!message){
            return res.status(400).json({message: "no message found"});
        }
    if (message.sender.toString() != req.user._id.toString()){
        return res.status(401).json({message : " No authorization to delete message"});
    }
    await message.deleteOne();
    res.status(201).json({message : " Message deleted successfully"});
    }
    catch(err){
        res.status(400).json({message : "Failed to delete Message"});
    }
    
};