"use strict";

// const notifcationModel = require("../models/notificationModel");
// var postSchemaModel = require("../models/postModel");

// require("dotenv").config();

// //user register

// //Verify the user mobile number via OTP

// exports.getNotifications = async function (req, res) {
//     console.log("getNotifications contorlller:")
//     console.log("req:", req?.params?.userId)
//     let _data = await notifcationModel.find({ userId: req?.params?.userId })
//     // console.log("_data111:", _data)
//     for (const post of _data) {
//     console.log("post----:", post)

//     console.log("post?.id:", post?.postId)
//         const posts = await postSchemaModel.findById(post?.postId)
//         console.log("posts:89098", posts)
//         // console.log("posts:", posts)
//         post.details=posts
//         console.log("post:1111", post)
//     }

//     // console.log("_post:", posts)
//     console.log("_data----:", _data)

//     return res.status(200).json(_data);
// };

// const notificationSchemaModel = require("../models/notificationSchema");

const notificationSchemaModel = require("../models/notificationModel");

exports.getNotifications = async function (req, res) {
  const { userId } = req.params || {};

  console.log("userId", userId);

  if (!userId) {
    res.status(404).json({ success: false, message: "UserId is required" });
  }
  try {
    const notifications = await notificationSchemaModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $sort: { notificationDate: -1 }
      }

    ]);
    // const postIds = notifications.map(notification => notification.postId);
    // console.log("postIds", postIds);
    console.log("notifications", notifications);
    res
      .status(200)
      .json({
        success: true,
        message: "notification retrieved successfully",
        data: notifications,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

