var mongoose = require("mongoose");
//var postSchemaModel = require("../models/postModel");
var path = require("path");
var UserSchema = require("../models/userModel");
var postSchemaModel = require("../models/postModel");
var notificationSchemaModel = require("../models/notificationModel");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const crypto = require("crypto");
const sharp = require("sharp");
const userSchemaModel = require("../models/userModel");


const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

//aws s3 setup
const BUCKET_NAME = process.env.BUCKET_NAME;
const BUCKET_REGION = process.env.BUCKET_REGION;
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const s3 = new S3Client({
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  region: BUCKET_REGION,
});

exports.upload = async function (req, res) {
  // console.log("Start Time:=", new Date().toLocaleTimeString());
  console.log("req", req?.body);
  const { userId, caption = "", userName, location, description } = req?.body;
  console.log("userId", userId);
  console.log("location", location);
  console.log("description", description);
  console.log("req.body:", req?.file);
  try {
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required." });
    }

    const userDetails = await UserSchema.findOne({ _id: userId });

    if (!userDetails) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!req?.file) {
      return res
        .status(400)
        .json({ success: false, message: "file is required." });
    }

    const uploadedFile = req?.file;
    console.log("uploadedFile", uploadedFile);
    const isVideo = uploadedFile.mimetype.startsWith("video/");
    console.log("isVideo", isVideo);

    if (isVideo) {
      buffer = (req?.file?.buffer);
      console.log("VideoData", buffer);
    } else {
      buffer = await sharp(req?.file?.buffer)
        .resize({ height: 1920, width: 1080, fit: "contain" })
        .toBuffer();
      console.log("ImageData", buffer);
    }

    const imageName = randomImageName();

    const params = {
      Bucket: BUCKET_NAME,
      Key: imageName,
      Body: buffer,
      ContentType: req?.file?.mimetype,
    };

    const rr = new PutObjectCommand(params);

    const ans = await s3.send(rr);

    const data = {
      caption,
      userId: userId,
      url: imageName,
      type: isVideo ? "reel" : "image",
      location: location,
      description: description,
      likes: [],
      comment: [],
    };

    const addPost = await postSchemaModel.create(data);

    if (addPost) {
      let updatePostCount = await userDetails.updateOne({
        $inc: { postCount: 1 },
      });
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully in the database.",
        data: data,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "File not saved in the database." });
    }
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error.", data: error });
  }
};

exports.postDelete = async function (req, res) {
  const { postId, userId } = req?.params;
  try {
    if (!userId || !postId) {
      return res
        .status(404)
        .json({ success: false, message: "userId and postId required" });
    }
    const existingpost = await postSchemaModel.findById(postId);

    const params = {
      Bucket: BUCKET_NAME,
      Key: existingpost?.url,
    };
    const cmd = new DeleteObjectCommand(params);
    const _del = await s3.send(cmd);
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
      .status(500)
      .json({ success: false, message: "sever error", error });
  }
};

exports.likePost = async function (req, res) {
  const { userId, postId, postUserId } = req.body;
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
      console.log("isLike", isLike);

      if (!isLike) {
        const like = post?.likes;
        like.push(userId);
        post.likes = like;
        const result = await postSchemaModel.updateOne({ _id: postId }, post);
        const getUserDetails = await userSchemaModel.findById(userId);

        let notificationObj = {
          userId: postUserId,
          postId: postId,
          comment: `${getUserDetails?.fullName} like your post`,
          commentUserId: userId,
          isLike: true,
          fullName: getUserDetails?.fullName,
        };
        const notification = await notificationSchemaModel.create(
          notificationObj
        );

        console.log("notification:", notification);
        return res
          .status(200)
          .json({ sucess: true, message: "like succesfully", post });
      } else {
        const indexOfDislike = post.likes.indexOf(userId);

        if (indexOfDislike !== -1) {
          post.likes.splice(indexOfDislike, 1);
          const result = await postSchemaModel.updateOne({ _id: postId }, post);
          const notification = await notificationSchemaModel.findOneAndDelete({
            commentUserId: userId,
            postId: postId,
          });
          console.log("notification delete:", notification);
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
  const _id = req?.params?._id;
  try {
    if (!_id) {
      return res
        .status(404)
        .json({ success: false, message: "postId is require" });
    }
    const result = await postSchemaModel.findById({ _id });
    if (result) {
      const likes = result.likes || [];
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
    // const posts = (await postSchemaModel.find({ type: "image" })).reverse();
    const posts = (
      await postSchemaModel.aggregate([
        {
          $match: { type: "image" },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
      ])
    ).reverse();
    for (const post of posts) {
      const getObjectParams = {
        Bucket: BUCKET_NAME,
        Key: post.url, //imageName
      };
      const expiresInSeconds = 7 * 24 * 60 * 60;
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, {
        expiresIn: expiresInSeconds,
      }); //we can also use expires in for security
      post.url = url;
    }
    const data = posts.slice(startIndex, endIndex);
    res.status(200).json({
      sucess: true,
      message: "post get successfuly",
      data: data,
    });
  } catch (error) {
    res.status(500).json({ sucess: false, message: "server error", error });
  }
};
exports.getPostById = async function (req, res) {
  const { postId } = req.params;
  console.log("req.params:", req.params)

  try {


    if (!postId) {
      return res
        .status(404)
        .json({ success: false, message: "id require" });
    }
    console.log("id:", postId)
    const post = await postSchemaModel.aggregate([
      {
        $match: {
          _id:new  mongoose.Types.ObjectId(postId),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',  
        },
      },
      {
        $unwind: '$userDetails',
      },
    ]);
    console.log("post:", post)

    // const post = (
    //   await postSchemaModel.aggregate([
    //     {
    //       $match: { _id: `${postId}`},
    //     },
    //     {
    //       $lookup: {
    //         from: "users",
    //         localField: "userId",
    //         foreignField: "_id",
    //         as: "userDetails",
    //       },
    //     },
    //     {
    //       $unwind: "$userDetails",
    //     },
    //   ])
    // ).reverse();
    const getObjectParams = {
      Bucket: BUCKET_NAME,
      Key: post[0].url, //imageName
    };
    const expiresInSeconds = 7 * 24 * 60 * 60;
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, {
      expiresIn: expiresInSeconds,
    }); //we can also use expires in for security
    post.url = url;
    console.log("posts:", post)
    res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: post,
    });

  } catch (error) {
    console.log("error:", error)
    return res
      .status(500)
      .json({ success: false, message: "server error", error });


  }

}

exports.getAllReels = async function (req, res) {
  // const { page = 1, limit = 10 } = req.query;
  try {
    // const startIndex = (page - 1) * limit;
    // const endIndex = page * limit;
    const posts = (
      await postSchemaModel.aggregate([
        {
          $match: { type: "reel" },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
      ])
    ).reverse();

    for (const post of posts) {
      const getObjectParams = {
        Bucket: BUCKET_NAME,
        Key: post.url,
      };
      const expiresInSeconds = 7 * 24 * 60 * 60;
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, {
        expiresIn: expiresInSeconds,
      });
      post.url = url;
    }
    // const data = posts.slice(startIndex, endIndex);
    res.status(200).json({
      success: true,
      message: "Reels retrieved successfully",
      data: posts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

exports.getUserPost = async (req, res) => {
  const userId = req.params.userId;
  try {
    if (!userId) {
      return res
        .status(404)
        .json({ success: false, message: "userId require" });
    }
    //   const posts = await postSchemaModel.aggregate([
    //     {
    //       $lookup: {
    //         from: "users",
    //         localField: "userId",
    //         foreignField: "_id",
    //         as: "user"
    //       },
    //     },
    //     {
    //       $unwind: "$user"
    //     },

    //   ]);

    const posts = (await postSchemaModel.find({ userId: userId })).reverse();
    if (!posts || posts.lenght == 0) {
      return res
        .status(404)
        .json({ success: false, message: "no posts found for this user" });
    }
    for (const post of posts) {
      const getObjectParams = {
        Bucket: BUCKET_NAME,
        Key: post.url,
      };

      const expiresInSeconds = 7 * 24 * 60 * 60;

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, {
        expiresIn: expiresInSeconds,
      }); //we can also use expires in for security
      post.url = url;
    }
    return res
      .status(200)
      .json({ success: true, message: "post retrieved sucessfully", posts });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "server error", error });
  }
};
