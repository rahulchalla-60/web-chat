import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
dotenv.config();

connectDB();
const app = express();

app.use(express.json());

app.use('/api/auth',authRoutes);
app.use('/api/message',messageRoutes);
app.use('/api/chats',chatRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`server is running on port ${PORT}`));