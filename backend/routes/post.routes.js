import express, { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createPost, deletePost, commentOnPost, likeUnlikePost, getAllPosts, getLikedPosts, getFollowingPosts, getUserPosts} from "../controllers/post.controller.js";
import { get } from "mongoose";
const router = express.Router();

router.get("/all",protectRoute,getAllPosts);
router.get("/following",protectRoute,getFollowingPosts);
router.get("/likes/:id",protectRoute,getLikedPosts);
//get a user posts
router.get("/user/:username",protectRoute,getUserPosts);
router.post("/create",protectRoute,createPost)
router.post("/like/:id",protectRoute,likeUnlikePost)
router.post("/comment/:id",protectRoute,commentOnPost)
router.delete("/:id",protectRoute,deletePost)

export default router;