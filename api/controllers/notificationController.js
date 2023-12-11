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
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
//aws s3 setup
const BUCKET_NAME = process.env.BUCKET_NAME;
const BUCKET_REGION = process.env.BUCKET_REGION;
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  region: BUCKET_REGION,
});

exports.getNotifications = async function (req, res) {
  const { userId } = req.params || {};

  console.log("userId", userId);

  if (!userId) {
    return res.status(404).json({ success: false, message: "UserId is required" });
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
        $sort: { notificationDate: -1 },
      },
    ]);

    for (const notification of notifications) {
      const getObjectParams = {
        Bucket: BUCKET_NAME,
        Key: notification?.post?.url,
      };
      console.log('notification',notification);  
      const expiresInSeconds = 4 * 24 * 60 * 60;
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, {
        expiresIn: expiresInSeconds,
      });

      notification.post.url = url; // Corrected variable name
    }

    console.log("notifications", notifications);

    res.status(200).json({
      success: true,
      message: "Notification retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
