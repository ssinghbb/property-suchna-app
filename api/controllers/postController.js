var mongoose = require("mongoose");
var postSchemaModel = require("../models/postModel");
var path = require("path");
var UserSchema = require("../models/userModel");
var postSchemaModel = require("../models/postModel");
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
    if (!userName) {
      return res
        .status(400)
        .json({ sucess: false, massage: "userName is requred....." });
    }

    const uploadedFile = req?.files?.file;

    const result = await cloudinary.uploader.upload(uploadedFile.tempFilePath);

    const data = {
      caption,
      userId: userId,
      url: result.secure_url,
      userName: userName,
      location: location,
      description: description,
      likes: [],  
      user: userDetails,
    };
    const addPost = await postSchemaModel.create(data);
    console.log("data", addPost);
    if (addPost) {
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



exports.likePost = async function (req, res) {
  const { userId, postId } = req.body;
  console.log("bodydata", req.body);
  console.log("postId", postId);
  try {
    if (!userId) {
      return res.status(400).json({ sucess: false, message: "userId require" });
    }

    if (!postId) {
      return res.status(400).json({ sucess: false, message: "postId require" });
    }
    console.log("postId", postId);
    const post = await postSchemaModel.findOne({ _id: postId });

    if (post) {
      console.log("post receve...", post);
      const isLike = post?.likes?.includes(userId);
      console.log("islike", isLike);
      if (!isLike) {
        const like = post?.likes;
        like.push(userId);
        post.likes = like;
        const result = await postSchemaModel.updateOne({ _id: postId }, post);
        return res
          .status(200)
          .json({ sucess: true, message: "like succesfully" });
      } else {
        const indexOfDislike = post.likes.indexOf(userId);
        console.log("indexofdis", indexOfDislike);
        if (indexOfDislike !== -1) {
          post.likes.splice(indexOfDislike, 1);
          const result = await postSchemaModel.updateOne({ _id: postId }, post);
          return res
            .status(200)
            .json({ success: true, message: "Dislike successful" });
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

// exports.getAllPost = async function (req, res) {
//   console.log("req", req);
//   let results = await postSchemaModel.find();
//   console.log("res", results);

//   res
//     .status(200)
//     .json({ sucess: true, message: "post get successfuly", data: results });
// };

exports.getAllPost = async function (req, res) {
  try {
    const result = (await postSchemaModel.find()).reverse()

    
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
