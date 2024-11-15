import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import { v2 as cloudinary } from "cloudinary";


import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js"

import connectMongoDB from "./db/connectMongoDb.js";

dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const app = express();
const PORT = process.env.PORT||3000;

// middleware
app.use(express.json()); // to parse req.body
app.use(urlencoded({extended: true}));
app.use(cookieParser());

app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/posts",postRoutes);   

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})