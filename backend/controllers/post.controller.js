import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import {v2 as cloudinary} from "cloudinary";

export const createPost = async(req,res) => {
    try{
        const {text} = req.body;
        const {img} = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        if(!text && !img){
            return res.status(400).json({message: "Please provide text or image"});
        }
        
        // it will work when we add client side code
        if(img){
           const uploadedResponse = await cloudinary.uploader.upload(img);
           img = uploadedResponse.secure_url;
        }
        const newPost = new Post({
            text,
            img,
            user: userId
        });

        await newPost.save();
        res.status(201).json(newPost);
    }
    catch(error){
        console.log("Internal server error", error.message);
        res.status(500).json({error: error.message});
    }
}

export const deletePost = async(req,res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({message: "Post not found"});
        }

        if(post.user.toString() !== req.user._id.toString()){
            return res.status(401).json({message: "You are not authorized to delete this post"});
        }

        if(post.img){
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(req.params.id);  

        res.status(200).json({message: "Post deleted successfully"});
    }
    catch(error){
        console.log("Internal server error", error.message);
        res.status(500).json({error: error.message});
    }
}   

export const commentOnPost = async(req,res) => {
   try{
     const {text} = req.body;
     const postId = req.params.id;
     const userId = req.user._id;
     if(!text){
        return res.status(400).json({message: "Please provide text"});
     }
     const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({message: "Post not found"});
        }
     
      const comment = {user: userId, text};
      post.comments.push(comment);
      await post.save();

      res.status(201).json(post);
   }
   catch(error){
    console.log("Internal server error", error.message);
    res.status(500).json({error: error.message});
   }
   

}

export const likeUnlikePost = async(req,res) => {
    try{
        const postId = req.params.id;
        const userId = req.user._id;
        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({message: "Post not found"});
        }
        const isLiked = post.likes.includes(userId);
        if(isLiked){
            // unlike the post
           await Post.updateOne({_id: postId}, {$pull: {likes: userId}});
           await User.updateOne({_id: userId}, {$pull: {likedPosts: postId}});
           res.status(200).json({message: "Post unliked successfully"});
        }
        else{
            // like the post
            post.likes.push(userId);
            await User.updateOne({_id: userId}, {$push: {likedPosts: postId}});
            await post.save();

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like",
            });

            await notification.save();
            res.status(200).json({message: "Post liked successfully"});
        }
    }
    catch(error){
        console.log("Internal server error", error.message);
        res.status(500).json({error: error.message});
    }
}

export const getAllPosts = async(req,res) => {
    try{
        // populate means it would add user details in post object through mongodb
        const posts = await Post.find().sort({createdAt: -1}).populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        });

        if(posts.length === 0){
            return res.status(200).json([]);
        }

        res.status(200).json(posts);
    }
    catch(error){
        console.log("Internal server error", error.message);
        res.status(500).json({error: error.message});
    }
}

export const getLikedPosts = async (req,res) => {
    // we are finding userId of user whose profile we are visiting
    const userId = req.params.id;
    try{
       const user = await User.findById(userId);
       if(!user){
           return res.status(404).json({message: "User not found"});
       }
       const likedPosts = await Post.find({_id: {$in: user.likedPosts}}).populate({
         path: "user",
         select: "-password"
       }).populate({
          path: "comments.user",
          select: "-password"
       });
       console.log(likedPosts);

       res.status(200).json(likedPosts);

    }
    catch(error){
        console.log("Internal server error", error.message);
        res.status(500).json({error: error.message});
    }
}

export const getFollowingPosts = async(req,res) => {
    try{
        const userId = req.user._id;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        const following = user.following;
        
        // posts users who is in following list
        const feedPosts = await Post.find({user: {$in: following}}).sort({createdAt: -1}).populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(feedPosts);
    }
    catch(error){
        console.log("Internal server error", error.message);
        res.status(500).json({error: error.message});
    }
}

export const getUserPosts = async(req,res) => {
    try{
       const {username} = req.params;
       const user = await User.findOne({username});
         if(!user){
              return res.status(404).json({message: "User not found"});
         }
       const posts = await Post.find({user: user._id}).sort({createdAt: -1}).populate({
          path: "user",
          select: "-password"
       }).populate({
           path: "comments.user",
           select: "-password"
       });

        res.status(200).json(posts);
    } 
    catch(error){   
        console.log("Internal server error", error.message);
        res.status(500).json({error: error.message});
    }
}