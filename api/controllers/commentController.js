var mongoose = require("mongoose");
var path = require("path");
var commentSchemaModel = require("../models/commentModel");
const { log } = require("console");
const { create } = require("../models/commentModel");
const postSchemaModel = require("../models/postModel");
const notificationSchemaModel = require("../models/notificationModel");
const { equal } = require("assert");
const userSchemaModel = require("../models/userModel");
const { release } = require("process");

exports.addComment = async function (req, res) {
  console.log("req", req?.body);
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
    console.log("post", post);

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

    console.log("resultcomment", result);
    const user = await userSchemaModel.findById(userId);
    console.log("userrrrrrr", user);
    if (result) {
      console.log("!post?.userId.equals(userId)", !post?.userId.equals(userId));
      if (!post?.userId.equals(userId)) {
        const notification = await notificationSchemaModel.create({
          userId: post?.userId,
          islikecommentUserId: userId,
          isComment: true,
          comment: comment,
          postId,
          fullName: user?.fullName,
          type: post.type,
        });
        console.log("notification", notification);
      }
      // console.log("comment add sussfully...");
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
  const { page = 1, limit = 10 } = req.query;
  const pagereq=req?.query?.page
  const pagelimit=req?.query?.limit
  console.log("page,limit",pagereq,pagelimit);
  const { postId } = req?.params
  console.log("postIdt",postId);
  

  try {
    if (!postId) {
      return res
        .status(404)
        .json({ success: false, message: "postId require" });
    }
    // const result = (await commentSchemaModel.find({ postId })).reverse();
    // console.log(" get comment result", result);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = await commentSchemaModel.aggregate([
      {
        $match: { postId: new mongoose.Types.ObjectId(postId) },
      },
      
      {
        $lookup: {
          from: "posts",
          localField: "postId",
          foreignField: "_id",
          as: "post",
        },
      },
      {
        $unwind: "$post",
      },
      {
        $lookup:{
          from:"users",
          localField:"userId",
          foreignField:"_id",
          as:"user"
        },
      },
      {
        $unwind: "$user",
      },
      {
        $sort: { commentedDate: -1 },
      },
    ])
     console.log("result",result);
    const data1 = result.slice(startIndex, endIndex);

    if (result) {
      return res.status(200).json({
        success: true,
        message: "comment get successfully",
        data: data1,
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







exports.addReelComment = async function (req, res) {
  const { userId, reelId, comment } = req?.body;
  // console.log("req", req);
  console.log("userId,reelId,comment", userId, reelId, comment);

  try {
    if (!reelId) {
      return res
        .status(400)
        .json({ success: false, message: "reelId required" });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId required" });
    }

    const reel = await postSchemaModel.findById(reelId);
    console.log("reel", reel);

    if (!reel) {
      return res
        .status(400)
        .json({ success: false, message: "reel has been deleted" });
    }

    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "comment required" });
    }

    const result = await commentSchemaModel.create({
      reelId,
      userId,
      comment,
      like: [],
    });
    console.log("result", result);
    const user = await userSchemaModel.findById(userId);
    console.log("userfind", user);
    console.log("reel?.userId", reel?.userId);
    console.log(userId, "userId");
    if (result) {
      if (!reel?.userId.equals(userId)) {
        const notification = await notificationSchemaModel.create({
          userId: reel?.userId,
          islikecommentUserId: userId,
          isComment: true,
          comment: comment,
          reelId,
          fullName: user?.fullName,
          type: reel.type,
        });
        console.log("notification",notification);
      }
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



exports.getReelComments = async (req, res) => {
  const { reelId } = req?.params;
  const { page = 1, limit = 10 } = req.query;
  const pagereq=req?.query?.page
  const pagelimit=req?.query?.limit
  console.log("page,limit",pagereq,pagelimit);
  console.log("reelId",reelId);
  // console.log("reelId", reelId);
  try {
    if (!reelId) {
      return res
        .status(404)
        .json({ success: false, message: "reelId require" });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    // const result = (await commentSchemaModel.find({ reelId })).reverse();
    // console.log(" get comment result", result);
    const result = await commentSchemaModel.aggregate([
      {
        $match: { reelId: new mongoose.Types.ObjectId(reelId) },
      },
      {
        $lookup:{
          from:"users",
          localField:"userId",
          foreignField:"_id",
          as:"user"
        },
      },
      {
        $unwind: "$user",
      },
      {
        $sort: { commentedDate: -1 },
      },
    ])
     console.log("result",result);
    const data1 = result.slice(startIndex, endIndex);
    if (result) {
      return res.status(200).json({
        success: true,
        message: "comment get successfully",
        data: data1,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "post not found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "server erroe", error:error.massage });
  }
};
