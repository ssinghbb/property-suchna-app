

var mongoose = require("mongoose");
var postSchemaModel = require("../models/postModel");
var path = require("path");

exports.upload = async function (req, res) {
  console.log("req", req?.body);
  const { _id, caption = "", _name, _location, dis } = req.body;

  try {
    if (!_id) {
      return res
        .status(400)
        .json({ sucess: false, massage: "_id is requred....." });
    }

    if (!req?.files?.file) {
      return res
        .status(400)
        .json({ sucess: false, massage: " file is requred..." });
    }

    const uploadedFile = req?.files?.file;
    var uploadedPath = path.join(__dirname, "../../post", uploadedFile.name);

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

    const data = {
      caption,
      postedBy: _id,
      url: uploadedPath,
      userName: _name,
      location: _location,
      description: dis,
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



