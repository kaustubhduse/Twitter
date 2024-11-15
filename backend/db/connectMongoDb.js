import { error } from "console";
import mongoose from "mongoose";

const connectMongoDB = async() => {
    try{
         const mc = await mongoose.connect(process.env.MONGO_URI);
         console.log('MongoDB connected');
    }
    catch{
        console.error(`Error connecting to mongodb ${error.message}`);
        process.exit(1);
    }
}

export default connectMongoDB;