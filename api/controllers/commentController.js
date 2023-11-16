var mongoose = require("mongoose");
//var postSchemaModel = require("../models/postModel");
var path = require("path");
var UserSchema = require("../models/userModel");
var postSchemaModel = require("../models/postModel");
var commentSchemaModel = require("../models/commentModel");



exports.addComment = async function (req, res) {
    const { postId, userId, comment } = req.body;
    try {
      if (!postId) {
        return res
          .status(400)
          .json({ sucess: false, message: "postId  require" });
      }
      if (!userId) {
        return res.status(400).json({ sucess: false, message: "userId require" });
      }
      if (!comment) {
        return res
          .status(400)
          .json({ sucess: false, message: "comment require" });
      }
      const result = await commentSchemaModel.create({
        likes: [],
        postId,
        userId,
        comment,
      });
  
      if (result) {
        return res
          .status(200)
          .json({ sucess: true, message: "comment added successfuly" });
      } else {
        return res
          .status(400)
          .json({ sucess: false, message: "comment not added " });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ sucess: false, message: "server error", error });
    }
  };
  

  exports.getComments = async function (req, res) {
    const { postId } = req.params;
  
    try {
      if (!postId) {
        return res
          .status(400)
          .json({ sucess: false, message: "postId  require" });
      }
  
      const result = await commentSchemaModel.find({ postId });
  
      if (result) {
        return res.status(200).json({
          sucess: true,
          message: "comment get successfuly",
          data: result,
        });
      } else {
        return res
          .status(400)
          .json({ sucess: false, message: "comment not found " });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ sucess: false, message: "server error", error });
    }
  };
  
  
  
  
  
  exports.likeComments = async function (req, res) {
    const { commentId, userId } = req.body;
  
    try {
      if (!commentId) {
        return res
          .status(400)
          .json({ sucess: false, message: " commentId require" });
      }
  
      if (!userId) {
        return res
          .status(400)
          .json({ sucess: false, message: " userId require" });
      }
  
      const comment = await commentSchemaModel.findOne({ _id: commentId });
  
      console.log("comment",comment);
      const islike = comment?.likes.includes(userId);
  
      if (!islike) {
        const like = comment?.likes;
        like.push(userId);
        comment.likes = like;
        const result = await commentSchemaModel.updateOne(
          { _id: commentId },
          comment
        );
        return res
          .status(200)
          .json({ sucess: true, message: "like  sucessfully" });
      } else {
        const indexOfDislike = comment.likes.indexOf(userId);
        console.log("indexofdis", indexOfDislike);
        if (indexOfDislike !== -1) {
          comment.likes.splice(indexOfDislike, 1);
          const result = await commentSchemaModel.updateOne(
            { _id: commentId },
            comment
          );
          return res
            .status(200)
            .json({ success: true, message: "Dislike successful" });
        } else {
          return res
            .status(400)
            .json({ success: false, message: "comment has not been disliked" });
        }
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: "server error",error });
    }
  };