import User from '../models/User.js';

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