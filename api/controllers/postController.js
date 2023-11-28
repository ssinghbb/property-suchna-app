var mongoose = require("mongoose");
//var postSchemaModel = require("../models/postModel");
var path = require("path");
var UserSchema = require("../models/userModel");
var postSchemaModel = require("../models/postModel");
const { log } = require("console");
const userSchemaModel = require("../models/userModel");
var cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECREAT,
});

exports.upload = async function (req, res) {
  const { userId, caption = "", userName, location, description } = req.body;
  try {
    if (!userId) {
      return res
        .status(400)
        .json({ sucess: false, massage: "userId is requred....." });
    }

    //const userDetails = await UserSchema.findOne({ _id: userId });
    const userDetails = await UserSchema.findById(userId);

    if (!userDetails) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!req?.files?.file) {
      return res
        .status(400)
        .json({ sucess: false, massage: " file is requred..." });
    }
    const uploadedFile = req?.files?.file;
    console.log("uploadedFile", uploadedFile);

    const isVideo = uploadedFile.mimetype.startsWith("video/");

    console.log("isVideo", isVideo);

    const result = await cloudinary.uploader.upload(uploadedFile.tempFilePath, {
      resource_type: isVideo ? "video" : "image",
    });

    console.log("result", result);

    const data = {
      caption,
      userId: userId,
      url: result.secure_url,
      type: isVideo ? "reel" : "image",
      location: location,
      description: description,
      likes: [],
      comment: [],
      user: userDetails,
    };

    const addPost = await postSchemaModel.create(data);
    console.log("data", addPost);
    if (addPost) {
      let _updatePostCount = await userDetails.updateOne(

        { $inc: { postCount: 1 } }
      )
      console.log("_updatePostCount:", _updatePostCount)
      return res.status(200).json({
        sucess: true,
        massage: "file uploaded susessfuly in database.....",
      });
    } else {
      return res
        .status(404)
        .json({ sucess: false, massage: "file not save in database....." });
    }
  } catch (error) {
    return res
      .status(404)
      .json({ sucess: false, massage: "server error", data: error });
  }
};


exports.postDelete = async function (req, res) {
  console.log("req", req.params);

  const { postId, userId } = req.params;
  console.log("postId", postId);
  console.log("userId", userId);
  try {
    if (!userId || !postId) {
      return res
        .status(404)
        .json({ success: false, message: "userId and postId required" });
    }
    const existingpost = await postSchemaModel.findById(postId);
    console.log("post", existingpost);
    if (!existingpost) {
      return res
        .status(404)
        .json({ success: false, message: "post not found" });
    }

    if (existingpost.userId.toString() !== userId) {
      return res.status(404).json({
        success: false,
        message: "Unauthorized: Post does not belong to the user.",
      });
    }
    const deletePost = await postSchemaModel.findByIdAndDelete(postId);

    if (deletePost) {
      return res
        .status(200)
        .json({ success: true, message: "post delete successfully" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Failed to delete post." });
    }
  } catch (error) {
    return res
      .status(404)
      .json({ sucess: false, message: "sever error", error });
  }
};


exports.likePost = async function (req, res) {
  const { userId, postId } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({ sucess: false, message: "userId require" });
    }

    if (!postId) {
      return res.status(400).json({ sucess: false, message: "postId require" });
    }
    const post = await postSchemaModel.findOne({ _id: postId });

    if (post) {
      const isLike = post?.likes?.includes(userId);
      if (!isLike) {
        const like = post?.likes;
        like.push(userId);
        post.likes = like;
        const result = await postSchemaModel.updateOne({ _id: postId }, post);
        return res
          .status(200)
          .json({ sucess: true, message: "like succesfully", post });
      } else {
        const indexOfDislike = post.likes.indexOf(userId);
        if (indexOfDislike !== -1) {
          post.likes.splice(indexOfDislike, 1);
          const result = await postSchemaModel.updateOne({ _id: postId }, post);
          return res
            .status(200)
            .json({ success: true, message: "Dislike successful", post });
        } else {
          return res
            .status(400)
            .json({ success: false, message: "Post has not been disliked" });
        }
      }
    } else {
      return res.status(400).json({ sucess: false, message: "post not found" });
    }
  } catch (error) {
    return res
      .status(404)
      .json({ sucess: false, message: "sever error", error });
  }
};

exports.getPostLikes = async function (req, res) {
  console.log("req.params", req.params);
  const _id = req.params._id;
  console.log("postId", _id);
  try {
    if (!_id) {
      return res
        .status(404)
        .json({ success: false, message: "postId is require" });
    }
    const result = await postSchemaModel.findById({ _id });
    console.log("result", result);
    if (result) {
      const likes = result.likes || [];
      //const totalLikes = likes.length;
      console.log("likes", likes);
      return res.status(200).json({
        success: true,
        message: "get likes successfully",
        likes,
        // totalLikes,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "server error" }, error);
  }
};

exports.getAllPost = async function (req, res) {
  const { page = 1, limit = 10 } = req.query;

  try {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = (await postSchemaModel.find({ type: "image" })).reverse();
    const data = result.slice(startIndex, endIndex);
    // console.log("data:", data);
    // console.log("resulthdijl", result);
    res.status(200).json({
      sucess: true,
      message: "post get successfuly",
      data: data,
    });
  } catch (error) {
    res.status(500).json({ sucess: false, message: "server error", error });
  }
};

exports.getAllReels = async function (req, res) {
  try {
    const result = (await postSchemaModel.find({ type: "reel" })).reverse();
    console.log("resulthdijl", result);
    res.status(200).json({
      sucess: true,
      message: "post get successfuly",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ sucess: false, message: "server error", error });
  }
};

exports.addComment = async function (req, res) {
  const { postId, userId, comment } = req.body;
  try {
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "postId required" });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId required" });
    }
    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "comment required" });
    }

    console.log("Provided userId:", userId);

    const user = await userSchemaModel.findOne({ _id: userId });

    console.log("userdetails", user);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const post = await postSchemaModel.findOne({ _id: postId });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    const userName = user?.fullName;
    console.log("userFullname", userName);

    post.comment.push({ userId, comment: comment, userName: userName });
    const result = await post.save();

    if (result) {
      return res.status(200).json({
        success: true,
        message: "Comment added successfully",
        data: result?.data,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Error in Comment added" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error });
  }
};

exports.getComments = async (req, res) => {
  const { postId } = req.params;
  console.log("postId", postId);
  try {
    if (!postId) {
      return res
        .status(404)
        .json({ success: false, message: "postId require" });
    }
    const result = await postSchemaModel.findById({ _id: postId });
    console.log("result", result);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "post not found" });
    }

    const comments = (result?.comment).reverse();

    return res.status(200).json({
      success: true,
      message: "comment get successfully",
      data: comments,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "server erroe", error });
  }
};
