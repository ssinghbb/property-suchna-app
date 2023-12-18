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
  
  console.log( "Start Time:=",new Date().toLocaleTimeString() );

  const { userId, caption = "", userName, location, description } = req.body;
  console.log("req.body:", req.body);
  console.log("req.body:", req.file);
  // return res.send({})

  try {
    console.log( "Start Time:",new Date().toLocaleTimeString() );

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

    if (!req?.file) {
      return res
        .status(400)
        .json({ sucess: false, massage: " file is requred..." });
    }

    const uploadedFile = req?.file;

    console.log(
      "uploadedFile",
      uploadedFile,
    );

    const isVideo = uploadedFile.mimetype.startsWith("video/");

    console.log(
      "isVideo",
      isVideo,
    );

    const buffer = await sharp(req?.file?.buffer)
      .resize({ height: 1920, width: 1080, fit: "contain" })
      .toBuffer();

    const imageName = randomImageName();

    const params = {
      Bucket: BUCKET_NAME,
      Key: imageName,
      Body: buffer,
      ContentType: req?.file?.mimetype,
    };

    const rr = new PutObjectCommand(params);

    console.log("rr:", rr);
    const ans = await s3.send(rr);

    console.log("ans:", ans);

    const data = {
      caption,
      userId: userId,
      url: imageName,
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
      let updatePostCount = await userDetails.updateOne({
        $inc: { postCount: 1 },
      });
      console.log(
        "updatePostCount:",
        updatePostCount,
      );
      return res.status(200).json({
        sucess: true,
        massage: "file uploaded susessfuly in database.....",
        data: data,
      });
    } else {
      return res
        .status(404)
        .json({ sucess: false, message: "file not save in database....." });
    }
  } catch (error) {
    return res
      .status(404)
      .json({ sucess: false, massage: "server error", data: error });
  }
};


exports.postDelete = async function (req, res) {
  
  console.log("reqqqqq", req);
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

    console.log("existingpost", existingpost);
    const params = {
      Bucket: BUCKET_NAME,
      Key: existingpost?.url,
    };
    const cmd = new DeleteObjectCommand(params);
    // console.log("cmd:", cmd)
    const _del = await s3.send(cmd);
    // console.log("_del:", _del)
    if (!existingpost) {
      return res
        .status(404)
        .json({ success: false, message: "post not found" });
    }

    if (existingpost.userId.toString() !== userId) {
      //console.log("");
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
  
  

  console.log("userId", userId);
  console.log("postId", postId);
  console.log("postUserId", postUserId);

  try {
    console.log("userId", userId);
    console.log("postId", postId);
    

    if (!userId) {
      return res.status(400).json({ sucess: false, message: "userId require" });
    }

    if (!postId) {
      return res.status(400).json({ sucess: false, message: "postId require" });
    }
    const post = await postSchemaModel.findOne({ _id: postId });

    console.log("post:", post);

    if (post) {
      const isLike = post?.likes?.includes(userId);
      console.log("isLike", isLike);

      if (!isLike) {
        const like = post?.likes;
        like.push(userId);
        post.likes = like;
        const result = await postSchemaModel.updateOne({ _id: postId }, post);
        console.log("notification:");
        const getUserDetails = await userSchemaModel.findById(userId);
        console.log("getUserDetails:", getUserDetails);

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
            // userId: userId,
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
  const startTime = new Date();
  console.log(
    "Start Time:",
    startTime.toLocaleTimeString(undefined, { second: "numeric" })
  );
  const { page = 1, limit = 10 } = req.query;

  try {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const posts = (await postSchemaModel.find({ type: "image" })).reverse();
    for (const post of posts) {
      const getObjectParams = {
        Bucket: BUCKET_NAME,
        Key: post.url, //imageName
      };

      const expiresInSeconds = 4 * 24 * 60 * 60;
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, {
        expiresIn: expiresInSeconds,
      }); //we can also use expires in for security
      post.url = url;
    }
    
    // console.log("data:", data);
    // console.log("resulthdijl", result);
    const data = posts.slice(startIndex, endIndex);
    console.log(
      "data with time:",
      data
    );
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
    //     // Other stages or operations as needed
    //   ]);

    const posts = (await postSchemaModel.find({ userId: userId })).reverse();
    console.log("post", posts);
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

      const expiresInSeconds = 4 * 24 * 60 * 60;

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
