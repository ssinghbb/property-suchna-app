"use strict";

const { decrypt } = require("dotenv");
const userSchemaModel = require("../models/userModel");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const crypto = require('crypto')
const sharp = require('sharp')

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

require("dotenv").config();
var mongoose = require("mongoose"),
  jwt = require("jsonwebtoken"),
  bcrypt = require("bcrypt"),
  User = mongoose.model("User");

const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.AUTH_TOKEN
);


const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

const BUCKET_NAME = process.env.BUCKET_NAME
const BUCKET_REGION = process.env.BUCKET_REGION
const ACCESS_KEY = process.env.ACCESS_KEY
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY

const s3 = new S3Client({
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY
  },
  region: BUCKET_REGION
})


//user register
exports.register = async function (req, res) {
  const data = req.body || {};

  console.log("L66 this is phone number:", req.body);
  console.log("L66 this is phone number:", req.body.phoneNumber);

  if (!data.phoneNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number is required." });
  }
  const existingUser = await userSchemaModel.findOne({
    phoneNumber: req.body.phoneNumber,
  });

  if (existingUser) {
    console.log("existingUser:", existingUser);
    return res.status(400).json({
      success: false,
      message: "User with this phone number already exists.",
    });
  }
  try {
    client.verify.v2
      .services(process.env.SERVICE_ID)
      .verifications.create({
        to: `+${data.phoneNumber}`,
        channel: "sms", // You can specify the channel here, either 'sms' or 'call'
      })
      .then((data) => {
        console.log("data:", data);
        return res.json({ success: true, data: "Otp send successfull" });
      })
      .catch((err) => {
        console.log("err:", err);
        return res.status(500).json({
          success: false,
          message: "Twilio verification failed. Please try again.",
        });
      });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ success: false, error: error });
  }
};

//Verify the user mobile number via OTP
exports.verify = function (req, res) {
  console.log("verify route");
  const phoneNumber = req.body.phoneNumber;
  console.log("🚀 ~ file: userController.js:127 ~ phoneNumber:", phoneNumber);
  const code = req.body.code;
  console.log("🚀 ~ file: userController.js:129 ~ code:", code);

  // Check if the OTP is not exactly 6 digits
  if (code.length !== 6) {
    return res
      .status(400)
      .json({ message: "Invalid OTP. OTP must be 6 digits." });
  }

  client.verify.v2
    .services(process.env.SERVICE_ID)
    .verificationChecks.create({
      to: `+${phoneNumber}`,
      code: code,
    })
    .then((data) => {
      console.log("🚀 ~ file: userControlle.js:144 ~ .then ~ data:", data);
      if (data.valid == false) {
        return res
          .status(400)
          .json({ success: false, message: "Entered wrong otp..." });
      }
      // Handle different verification statuses
      if (data.status === "approved") {
        var newUser = new User(req.body);
        User.findOne({ phoneNumber: req.body.phoneNumber })
          .then((existingUser) => {
            if (existingUser) {
              console.log("existingUser:", existingUser);
              return res.status(400).json({
                success: false,
                message: "User with this phone number already exists.",
              });
            }

            // Hash the password and confirmPassword before saving
            newUser.hash_password = bcrypt.hashSync(req.body.password, 10);
            newUser.confirmPassword = bcrypt.hashSync(
              req.body.confirmPassword,
              10
            );

            newUser
              .save()
              .then((user) => {
                console.log("user:", user);
                if (!user) {
                  return res.status(400).json({
                    success: false,
                    message: "User registration failed. Please try again.",
                  });
                }
                return res
                  .status(200)
                  .json({ success: false, data: "user registered" });

                // Twilio verification code after the user is successfully saved
              })
              .catch((err) => {
                console.log("err:", err);
                let errorMessage = "An error occurred while creating the user.";
                return res.status(400).send({
                  message: errorMessage,
                });
              });
          })
          .catch((err) => {
            console.log("err:", err);
            return res.status(500).send({ message: "Internal Server Error" });
          });
      } else if (data.status === "pending") {
        return res
          .status(400)
          .json({ message: "Verification pending. Please try again." });
      } else if (data.status === "canceled") {
        return res.status(400).json({
          message: "Verification canceled. Please request a new code.",
        });
      } else if (data.status === "failed") {
        return res
          .status(400)
          .json({ message: "Verification failed. Please try again." });
      } else {
        return res
          .status(400)
          .json({ message: "Invalid OTP. Please try again." });
      }
    })
    .catch((error) => {
      console.error("Error occurred during verification:", error);
      if (error.code === 20404) {
        return res.status(404).json({
          message: "Verification service not found. Please contact support.",
        });
      } else if (error.code === 60202) {
        return res
          .status(429)
          .json({ message: "Too many attempts. Please try again later." });
      }
      return res.status(500).json({
        message: "Error occurred during verification. Please try again.",
      });
    });
};

exports.testapi = function (req, res) {
  return res.status(200).json({ message: "Server is running...." });
};

exports.sign_in = async function (req, res) {
  const { phoneNumber, password } = req.body;
  if (!phoneNumber) {
    return res
      .status(404)
      .json({ success: false, message: "phoneNumber is require" });
  }

  if (!password) {
    return res
      .status(404)
      .json({ success: false, message: "password is require" });
  }

  try {
    let user = await userSchemaModel.findOne({ phoneNumber });
    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.hash_password);
      if (passwordMatch) {
        console.log("password is correct");
        const expirationTime =
          Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
        const token = jwt.sign(
          { data: { _id: user._id }, exp: expirationTime },
          process.env.JWT_SECRET_KEY
        );
        const getObjectParams = {
          Bucket: BUCKET_NAME,
          Key: user?.url  //imageName
        }
        const command = new GetObjectCommand(getObjectParams);
        console.log("command:", command)
        const url = await getSignedUrl(s3, command);   //we can also use expires in for security 
        console.log("url:", url)

        // user.url = url
        console.log("user?.url:", user?.url)
        return res.status(200).json({
          success: true,
          message: "login successfully",
          data: { user, token },
        });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "incorrect password" });
      }
    } else {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "server error", error });
  }
};

exports.verifyToken = function (req, res, next) {
  if (req.user) {
    next();
  } else {
    return res.status(401).json({ message: "Unauthorized user!!" });
  }
};

exports.profile = function (req, res, next) {
  if (req.user) {
    res.send(req.user);
    next();
  } else {
    return res.status(401).json({ message: "Invalid token" });
  }
};

exports.updateUser = async function (req, res) {
  console.log("req", req);
  // console.log("Request body:", req?.files?.file);

  const { fullName, bio, userId } = req?.body;
  // const _id = req?.params?._id;

  console.log("userId", userId);
  console.log("fullname", fullName, bio, userId);

  try {
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId not found" });
    }

    const user = await userSchemaModel.findById(userId);
    console.log("user", user);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const uploadedFile = req?.file;
    const buffer = await sharp(req?.file?.buffer).resize({ height: 1920, width: 1080, fit: 'contain' }).toBuffer();



    console.log("upladfile", uploadedFile);

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

    const getObjectParams = {
      Bucket: BUCKET_NAME,
      Key: imageName  //imageName
    }
    const command = new GetObjectCommand(getObjectParams);
    console.log("command:", command)
    const url = await getSignedUrl(s3, command);   //we can also use expires in for security 
    console.log("url:", url)
    // console.log("ans:", ans)
    user.url = url;
    // const result = await cloudinary.uploader.upload(uploadedFile.tempFilePath);


    if (req.body.fullName) {
      user.fullName = req.body.fullName;
    }

    // if (req.body.phoneNumber) {
    //   user.phoneNumber = req.body.phoneNumber;
    // }

    if (req.body.bio) {
      user.bio = req.body.bio;
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error });
  }
};




// exports.whatsAppMessage = async function (req, res) {
//   const { Location, Name, Description, Queries } = req.body;
//   console.log("Location", Location);
//   console.log("Name", Name);
//   console.log("Description", Description);

//   console.log("Queries", Queries);

//   try {
//     client.messages
//       .create({
//         body: `\nLocation: ${Location},\nUsername: ${Name},\nDescription: ${Description},\nQuery: ${Queries}`,
//         from: "whatsapp:+14155238886",
//         to: "whatsapp:+918319453618",
//       })
//       .then((message) => console.log("message send successfully"));
//     return res
//       .status(200)
//       .json({ success: true, message: "message send successfully" });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ success: false, message: "server error", error });
//   }
// };
