import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
export const registerUser = async(req,res) =>{
    try{
        const {name,email} = req.body;
        const user = await User.create({
            name,
            email,
            password : req.body.password
        });
        res.status(201).json({
            _id : user._id,
            name : user.name,
            email : user.email
        });
    }
    catch(err){
        res.status(400).json({message:"User registration failed"});
    }
};

export const loginUser = async(req,res) =>{
    const {email,password} = req.body;
    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"User not found"});
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if (!isMatch){
            return res.status(400).json({message:"Password doesnt match"});
        }
        const token = jwt.sign({id : user._id},process.env.JWT_SECRET,{expiresIn : "1d"});
        res.status(200).json({
            token,
            user:{
                id : user._id,
                name : user.name,
                email : user.email
            }
        });


    }
    catch(err){
        res.status(500).json({message:"Server failed"})

    }
};