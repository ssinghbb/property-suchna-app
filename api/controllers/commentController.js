var mongoose = require("mongoose");
var path = require("path");
var commentSchemaModel = require("../models/commentModel");
const { log } = require("console");
const { create } = require("../models/commentModel");
const postSchemaModel = require("../models/postModel");
const notificationSchemaModel = require("../models/notificationModel");
const { equal } = require("assert");
const userSchemaModel = require("../models/userModel");

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

    const post = await postSchemaModel.findById(postId);

    if (!post) {
      return res
        .status(400)
        .json({ success: false, message: "Post has been deleted" });
    }

    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "comment required" });
    }
    
    const result = await commentSchemaModel.create({
      postId,
      userId,
      comment,
      like: [],
    });

    const user = await userSchemaModel.findById(userId);
    
    if (result) {
      if(!post?.userId.equals(userId)){
      const response = await notificationSchemaModel.create({
        userId: post?.userId,
        commentUserId: userId,
        isComment: true,
        comment: comment,
        postId,
        fullName: user?.fullName
      })
      };
      return res.status(200).json({
        success: true,
        message: "Comment added  successfully",
        data: result,
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
    const result = (await commentSchemaModel.find({ postId })).reverse();
    console.log(" get comment result", result);

    if (result) {
      return res.status(200).json({
        success: true,
        message: "comment get successfully",
        data: result,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "post not found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "server erroe", error });
  }
};
