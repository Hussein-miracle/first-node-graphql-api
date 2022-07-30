const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Post = require("../models/post");
const { clearImage } = require("../utils/file");


const Resolvers = {
  createUser: async (args, req) => {
    const { email, password, name } = args.userInput;

    const errors = [];

    if (!validator.isEmail(email)) {
      errors.push({
        message: "E-mail is invalid.",
      });
    }

    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({
        message: "Password too short,invalid.",
      });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid Inputs");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      const error = new Error("User exists already!");

      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    const createdUser = await user.save();

    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    };
  },
  login: async (args, req) => {
    const { email, password } = args;
    const user = await User.findOne({
      email,
    });

    if (!user) {
      const error = new Error("User not found.");

      error.code = 401;

      throw error;
    }

    const correct = await bcrypt.compare(password, user.password);

    if (!correct) {
      const error = new Error("Password is incorrect");

      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email,
        userId: user._id.toString(),
      },
      "postssupersec",
      {
        expiresIn: "2h",
      }
    );

    return {
      token,
      userId: user._id.toString(),
    };
  },
  createPost: async (args, req) => {
    const { title, content, imageUrl } = args.postInput;

    
    if(!req.isAuth){
      const error = new Error("Not authenticated.");
      error.code = 401;
      throw error;
    }
    
    
    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({
        message: "Title input not valid.",
      });
    }

    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({
        message: "Content input not valid",
      });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid Inputs.");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const user = await User.findById(req.userId);

    if(!user){
      const error = new Error("Invalid user.");
      error.data = errors;
      error.code = 401;
      throw error;
    }

    const post = new Post({
      title,
      content,
      imageUrl,
      creator:user
    });

    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    // console.log(createdPost , "createdPost");
    // console.log(user , "user");

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  getPosts: async(args,req) => {
    const page = args.page || 1;
    const perPage = 5;

    if(!req.isAuth){
      const error = new Error("Not authenticated.");
      error.code = 401;
      throw error;
    }


    const postsGotten =  await Post.find().sort({
      createdAt : -1
    })
    .skip((page - 1) * perPage)
    .limit(perPage)
    .populate('creator');

    const posts = postsGotten.map((p) => {
      return {
        ...p._doc,
        _id:p._id.toString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }
    })

    const totalPosts = await Post.find().countDocuments();


    return {
      posts,
      totalPosts
    }

  }
  ,
  getPostById: async(args,req) => {
    const { postId }  = args;

    
    if(!req.isAuth){
      const error = new Error("Not authenticated.");
      error.code = 401;
      throw error;
    }


    const post  = await (await Post.findById(postId)).populate("creator");

    // console.log(post , "post by  id");
    if(!post){
      const error = new Error("Post not found!.");
      error.code = 404;
      throw error;
    }



    return {
      ...post._doc,
      _id:post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }
  },
  updatePost: async (args,req) => {
    const {postId,postInput:{title,content,imageUrl}} = args;


    if(!req.isAuth){
      const error = new Error("Not authenticated.");
      error.code = 401;
      throw error;
    }


    const post  = await (await Post.findById(postId)).populate("creator");

    if(!post){
      const error = new Error("Post not found!.");
      error.code = 404;
      throw error;
    }

    if(post.creator._id.toString() !== req.userId.toString()){
      const error = new Error("Not Authorized.");
      error.code = 403;
      throw error;
    }


    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({
        message: "Title input not valid.",
      });
    }

    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({
        message: "Content input not valid",
      });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid Inputs.");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    post.title = title;
    post.content = content;
    if(imageUrl !== "undefined"){
      post.imageUrl = imageUrl;
    }
    post.updatedAt = new Date();

    const updatedpost = await post.save();

    return {
      ...updatedpost._doc,
      _id:updatedpost._id.toString(),
      createdAt: updatedpost.createdAt.toISOString(),
      updatedAt: updatedpost.updatedAt.toISOString(),
    }

  },
  deletePost : async(args,req) => {
    const { postId }  = args;
    // console.log("🚀 ~ file: resolvers.js ~ line 300 ~ deletePost:async ~ postId", postId)

    
    if(!req.isAuth){
      const error = new Error("Not authenticated.");
      error.code = 401;
      throw error;
    }


    const post  = await Post.findById(postId);

    if(!post){
      const error = new Error("Post not found!.");
      error.code = 404;
      throw error;
    }

    console.log(req.userId , "userId")
    
    if(post.creator.toString() !== req.userId.toString()){
      const error = new Error("Not Authorized.");
      error.code = 403;
      throw error;
    }

    clearImage(post.imageUrl);

    await Post.findByIdAndRemove(postId);


    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    return {
      success:true,
      message:"Deleting successful"
    };
  },
  updateUserStatus:  async ( args,req ) => {
    const {status} = args;

    
    if(!req.isAuth){
      const error = new Error("Not authenticated.");
      error.code = 401;
      throw error;

    }

    const user = await User.findById(req.userId);

    if(!user){
      const error = new Error("User not found!.");
      error.code = 404;
      throw error;
    }

    user.status = status;

    await user.save();

    
    return {
      ...user._doc,
      _id:user._id.toString(),
    }
  },
  user: async ( args,req ) => {

    if(!req.isAuth){
      const error = new Error("Not authenticated.");
      error.code = 401;
      throw error;

    }

    const user = await User.findById(req.userId);

    if(!user){
      const error = new Error("User not found!.");
      error.code = 404;
      throw error;
    }


    return {
      ...user._doc,
      _id:user._id.toString(),
    }

  }
};


module.exports = Resolvers;