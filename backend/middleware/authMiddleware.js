import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
//validating the user
export const validateRegister = async(req,res,next) => {
    const {name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({message : 'please enter all fields'});
    }
    if (password.length < 6){
        return res.status(400),json({message:"please enter valid password"});
    }
    try{
        const userExists = await User.findOne({email});
        if (userExists){
            return res.status(400).json({message:"User already exists"});
        }
        next();
    }
    catch(err){
        res.status(500).json({message:"server error"});
    }
};
//password hashing

export const hashPassword = async(req,res,next)=>{
    try{
        const salt = await bcrypt.genSalt(10)
        req.body.password = await bcrypt.hash(req.body.password,salt);
        next();
    }
    catch(err){
        res.status(500).json({message:"password hashing failed"});
    }
};

//protect route for login

export const protect = async(req,res,next) =>{
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer "))
    {
        try{
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");
            next();
        }
        catch(err){
            return res.status(401).json({message:"Not authorized, token failed"});
        }
    }
    if (!token){
        res.status(401).json({message:"Not authorized,no token"});
    }

};