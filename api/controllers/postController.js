var mongoose = require("mongoose");
var postSchemaModel = require("../models/postModel");
var path = require("path");
var UserSchema = require("../models/userModel");
var postSchemaModel = require("../models/postModel");
const fs = require("fs");

exports.upload = async function (req, res) {
  console.log("reqyyy", req.body);
  console.log("reqyyy files", req.files);
  const { userId, caption = "", userName, location, description } = req.body;
  console.log("requserId", req?.body?.userId);

  try {
    if (!userId) {
      return res
        .status(400)
        .json({ sucess: false, massage: "userId is requred....." });
    }

    //const userDetails = await UserSchema.findOne({ _id: userId });
    const userDetails = await UserSchema.findById(userId);

    console.log("userdetails", userDetails);

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

    // const uploadedFile = req?.files?.file.data;

    const uploadedFile = req?.files?.file;
    console.log("buffer data", uploadedFile);
    // Get the current date and time
    var currentDate = new Date();

    // Format the date as YYYY-MM-DD_HH-mm-ss

    var formattedDate = currentDate
      .toISOString()
      .replace(/[:T\-Z]/g, "")
      .slice(0, -4);
    const fileName = formattedDate + "-" + uploadedFile.name;
    var uploadedPath = path.join(__dirname, "../../post", fileName);

    uploadedFile.mv(uploadedPath, (err) => {
      if (err) {
        return res
          .status(400)
          .json({ sucess: false, massage: "Error uploading file" });
      }
      return res
        .status(200)
        .json({ sucess: true, message: "file uploaded sucessfully" });
    });

    //const { fullName, _id } = userDetails;

    const data = {
      caption,
      userId: userId,
      //url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Sunflower_from_Silesia2.jpg/800px-Sunflower_from_Silesia2.jpg',
      url: fileName,
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
  console.log("req", req);

  try {
  

      let results = await postSchemaModel.find();
      console.log("res", results);

      res
        .status(200)
        .json({ sucess: true, message: "post get successfuly", data: results });
    
  } catch (error) {
    res.status(500).json({ sucess: false, message: "server error", error });
  }
};
