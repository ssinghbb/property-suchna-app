var mongoose = require("mongoose");
//var postSchemaModel = require("../models/postModel");
var path = require("path");
var UserSchema = require("../models/userModel");
var postSchemaModel = require("../models/postModel");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const crypto = require('crypto')
const sharp = require('sharp')
const userSchemaModel = require("../models/userModel");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


//aws s3 setup 
const BUCKET_NAME = process.env.BUCKET_NAME
const BUCKET_REGION = process.env.BUCKET_REGION
const ACCESS_KEY = process.env.ACCESS_KEY
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY
const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')



const s3 = new S3Client({
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY
  },
  region: BUCKET_REGION
})









exports.upload = async function (req, res) {
  const { userId, caption = "", userName, location, description } = req.body;
  console.log("req.body:", req.body)
  console.log("req.body:", req.file)
  // return res.send({})
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

    if (!req?.file) {
      return res
        .status(400)
        .json({ sucess: false, massage: " file is requred..." });
    }
    const uploadedFile = req?.file;
    // console.log("uploadedFile", uploadedFile);

    const isVideo = uploadedFile.mimetype.startsWith("video/");

    console.log("isVideo", isVideo);
    const buffer = await sharp(req?.file?.buffer).resize({ height: 1920, width: 1080, fit: 'contain' }).toBuffer();
    const imageName = randomImageName()
    const params = {
      Bucket: BUCKET_NAME,
      Key: imageName,
      Body: buffer,
      ContentType: req?.file?.mimetype
    }
    
    const rr = new PutObjectCommand(params)
    console.log("rr:", rr)
    const ans = await s3.send(rr)
    console.log("ans:", ans)

    // const result = await cloudinary.uploader.upload(uploadedFile.tempFilePath, {
    //   resource_type: isVideo ? "video" : "image",
    // });

    // console.log("result", result);

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
      Key: existingpost?.url
    }
    const cmd = new DeleteObjectCommand(params)
    // console.log("cmd:", cmd)
    const _del = await s3.send(cmd)
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

    const posts = (await postSchemaModel.find({ type: "image" })).reverse();
    for (const post of posts) {

      const getObjectParams = {
        Bucket: BUCKET_NAME,
        Key: post.url  //imageName
      }
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command);   //we can also use expires in for security 
      post.url = url
    }
    // console.log("data:", data);
    // console.log("resulthdijl", result);
    const data = posts.slice(startIndex, endIndex);
    console.log("data:", data)
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
