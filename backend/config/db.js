import mongoose from "mongoose";

const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to the database");
    }
    catch (err){
        console.error(err.message);
        process.exit(1);

    }
}
export default connectDB;