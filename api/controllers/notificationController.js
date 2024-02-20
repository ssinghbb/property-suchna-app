"use strict";
const mongoose = require("mongoose");

const notificationSchemaModel = require("../models/notificationModel");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { ObjectId } = mongoose.Schema.Types; //ObjectId is a type used for representing MongoDB document IDs.

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
    return res
      .status(404)
      .json({ success: false, message: "UserId is required" });
  }

  try {
    const notifications = await notificationSchemaModel.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },

      {
        // $find:"userId",
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
        $addFields: {
          lookupField: {
            $cond: {
              if: { $eq: ["$type", "image"] },
              then: "$postId",
              else: "$reelId",
            },
          },
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "lookupField",
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
      const expiresInSeconds = 4 * 24 * 60 * 60;
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, {
        expiresIn: expiresInSeconds,
      });

      notification.post.url = url;
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
