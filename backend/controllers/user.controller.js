import brcypt from "bcryptjs"
import {v2 as cloudinary} from "cloudinary"

//models
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { response } from "express";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } 
  catch (error) {
    console.log("Error in getting user profile", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if(id == req.user._id.toString()){
        return res.status(400).json({error: "You can't follow or unfollow yourself"});
    }

    if(!userToModify || !currentUser){
        return res.status(400).json({error: "User not found"});
    }

    const isFollowing = currentUser.following.includes(id);
    
    // id = jiski post hai uska id
    // req.user._id = user ka id
    if(isFollowing){
       // Unfollow the user
       await User.findByIdAndUpdate(id, {$pull: {followers: req.user._id}});
       await User.findByIdAndUpdate(req.user._id,{$pull: {following: id}});
       res.status(200).json({message: "User unfollowed sucessfully"});
    }
    else{
       // Follow the user
       await User.findByIdAndUpdate(id, {$push: {followers: req.user._id}});
       await User.findByIdAndUpdate(req.user._id,{$push: {following: id}});
       // Send notification to the user
       
       const newNotification = new Notification({
          type: "follow",
          from: req.user._id,
          to: id
       });

       await newNotification.save();
       // return id of user as a response
       res.status(200).json({message: "User followed sucessfully"});
    }
  } catch (error) {
    console.log("Error in getting user profile", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUsers = async (req,res) => {
  try{
     const userId = req.user._id;
     const usersFollowedByMe = await User.findById(userId).select("following");

     const users = await User.aggregate([
      {
        $match: {
          _id:{$ne: userId},
        },
      },
      {
        $sample: {
            size: 10
        },
      },
     ]);

     const filteredUsers = users.filter((user) => 
        !usersFollowedByMe.following.includes(user._id.toString())
     );  
     const suggestedUsers = filteredUsers.slice(0,4);
     
     // used to protect the password
     suggestedUsers.forEach((user) => (
        user.password = null
     ));

     res.status(200).json(suggestedUsers);

  }
  catch(error){
     console.log("Error in suggested users", error.message);
     res.status(500).json({message: error.message});
  }
}

export const updateUser = async(req,res) => {
    const {fullname, email, username, currentPassword, newPassword, bio, link} = req.body;
    let {profileImg, coverImg} = req.body;

    const userId = req.user._id;
    try{
       let user = await User.findById(userId);
       if(!user){
         return res.status(400).json({error: "User not found"});
       }
       if((!currentPassword && newPassword) || (currentPassword && !newPassword)){
         return res.status(400).json({error: "Please provide both current password and new password"});
       }
        
       if(currentPassword && newPassword){
         const isMatch = await brcypt.compare(currentPassword, user.password);
         if(!isMatch){
           return res.status(400).json({error: "Current Password is incorrect"});
         }

         if(newPassword.length<6){
          return res.status(400).json({error: "Password length should be greater than equal to 6"});
         }

         const salt = await brcypt.genSalt(10);
         user.password = await brcypt.hash(newPassword, salt)
       }

       if(profileImg){
            if(user.profileImg){
              await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg)
            profileImg = uploadedResponse.secure_url;
       }

       if(coverImg){
            if(user.coverImg){
              await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg)
            coverImg = uploadedResponse.secure_url
       }

       user.fullname = fullname || user.fullname;
       user.email = email || user.email;
       user.username = username || user.username;
       user.bio = bio || user.bio;
       user.link = link || user.link;
       user.profileImg = profileImg || user.profileImg;
       user.coverImg = coverImg || user.coverImg;

       user = await user.save();
       
       user.password = null;
       return res.status(200).json(user);
    }
    catch(error){
        res.status(500).json({error: error.message})
    }
}