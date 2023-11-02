'use strict';

require('dotenv').config(); // Load environment variables from .env file
var mongoose = require('mongoose'),
  jwt = require('jsonwebtoken'),
  bcrypt = require('bcrypt'),
  User = mongoose.model('User');

const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.AUTH_TOKEN
);

// exports.register = function(req, res) {
//   var newUser = new User(req.body);
//   newUser.password = req.body.password;
//   newUser.confirmPassword = req.body.confirmPassword;

//   // Check if password and confirmPassword match
//   if (req.body.password !== req.body.confirmPassword) {
//     return res.status(400).json({ message: "Password and confirm password do not match." });
//   }

//   // Check if the phone number already exists in the database
//   if (!req.body.phoneNumber) {
//     return res.status(400).json({ message: "Phone number is required." });
//   }

//   User.findOne({ phoneNumber: req.body.phoneNumber })
//     .then(existingUser => {
//       if (existingUser) {
//         return res.status(400).json({ message: "User with this phone number already exists." });
//       }

//       // Hash the password and confirmPassword before saving
//       newUser.hash_password = bcrypt.hashSync(req.body.password, 10);
//       newUser.confirmPassword = bcrypt.hashSync(req.body.confirmPassword, 10);

//       newUser.save()
//         .then(user => {
//           if (!user) {
//             return res.status(400).send({
//               message: "User registration failed. Please try again."
//             });
//           }
//           user.password = undefined;
//           user.confirmPassword = undefined;
//           return res.json(user._id);
//         })
//         .catch(err => {
//           let errorMessage = "An error occurred while creating the user.";
//           return res.status(400).send({
//             message: errorMessage
//           });
//         });
//     })
//     .catch(err => {
//       return res.status(500).send({ message: "Internal Server Error" });
//     });
// };

exports.register = function (req, res) {
  var newUser = new User(req.body);
  newUser.password = req.body.password;
  newUser.confirmPassword = req.body.confirmPassword;
  console.log("L66 this is phone number:", req.body);
  console.log("L66 this is phone number:", req.body.phoneNumber);
  // Check if password and confirmPassword match
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({ message: "Password and confirm password do not match." });
  }

  // Check if the phone number already exists in the database
  if (!req.body.phoneNumber) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  User.findOne({ phoneNumber: req.body.phoneNumber })
    .then(existingUser => {
      if (existingUser) {
        console.log("existingUser:", existingUser)
        return res.status(400).json({ message: "User with this phone number already exists." });
      }

      // Hash the password and confirmPassword before saving
      newUser.hash_password = bcrypt.hashSync(req.body.password, 10);
      newUser.confirmPassword = bcrypt.hashSync(req.body.confirmPassword, 10);

      newUser.save()
        .then(user => {
          console.log("user:", user)
          if (!user) {
            return res.status(400).send({
              message: "User registration failed. Please try again."
            });
          }

          // Twilio verification code after the user is successfully saved
          client
            .verify.v2.services(process.env.SERVICE_ID)
            .verifications
            .create({
              to: `+${req.body.phoneNumber}`,
              channel: 'sms' // You can specify the channel here, either 'sms' or 'call'
            })
            .then((data) => {
              console.log("data:", data)
              user.password = undefined;
              user.confirmPassword = undefined;
              return res.json(user._id);
            })
            .catch((err) => {
              console.log("err:", err)
              return res.status(500).json({ message: "Twilio verification failed. Please try again." });
            });
        })
        .catch(err => {
          console.log("err:", err)
          let errorMessage = "An error occurred while creating the user.";
          return res.status(400).send({
            message: errorMessage
          });
        });
    })
    .catch(err => {
      console.log("err:", err)
      return res.status(500).send({ message: "Internal Server Error" });
    });
};

//Verify the user mobile number via OTP
exports.verify = function (req, res) {
  const phoneNumber = req.body.phonenumber;
  console.log("🚀 ~ file: userController.js:127 ~ phoneNumber:", phoneNumber)
  const code = req.body.code;
  console.log("🚀 ~ file: userController.js:129 ~ code:", code)

  // Check if the OTP is not exactly 6 digits
  if (code.length !== 6) {
    return res.status(400).json({ message: 'Invalid OTP. OTP must be 6 digits.' });
  }

  client
    .verify.v2.services(process.env.SERVICE_ID)
    .verificationChecks
    .create({
      to: `+${phoneNumber}`,
      code: code
    })
    .then((data) => {
      console.log("🚀 ~ file: userController.js:144 ~ .then ~ data:", data)
      if (data.valid == false) {
        return res.status(400).json({ message: "Entered wrong otp..." })
      }
      // Handle different verification statuses
      if (data.status === 'approved') {
        return res.status(200).json({ message: 'Verification successful.' });
      } else if (data.status === 'pending') {
        return res.status(400).json({ message: 'Verification pending. Please try again.' });
      } else if (data.status === 'canceled') {
        return res.status(400).json({ message: 'Verification canceled. Please request a new code.' });
      } else if (data.status === 'failed') {
        return res.status(400).json({ message: 'Verification failed. Please try again.' });
      } else {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
      }
    })
    .catch((error) => {
      console.error("Error occurred during verification:", error);
      if (error.code === 20404) {
        return res.status(404).json({ message: 'Verification service not found. Please contact support.' });
      } else if (error.code === 60202) {
        return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
      }
      return res.status(500).json({ message: 'Error occurred during verification. Please try again.' });
    });
};

exports.testapi = function (req, res) {
  return res.status(200).json({ message: "Server is running...." });
};




exports.sign_in = function (req, res) {
  console.log("🚀 ~ file: userController.js:59 ~ req:", req.body)
  User.findOne({ phoneNumber: req.body.phoneNumber })
    .then(user => {
      //console.log("🚀 ~ file: userController.js:62 ~ user:", user)
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      if (!user.comparePassword(req.body.password)) {
        return res.status(401).json({ message: 'Authentication failed. Invalid password.' });
      }
      return res.json({ token: jwt.sign({ phoneNumber: user.phoneNumber, fullName: user.fullName, _id: user._id }, 'RESTFULAPIs') });
    })
    .catch(err => {
      console.error("Error occurred during sign-in:", err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error. Please check your request.' });
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    });
  //console.log("🚀 ~ file: userController.js:78 ~ phoneNumber:", phoneNumber)
};

exports.loginRequired = function (req, res, next) {
  if (req.user) {
    next();
  } else {

    return res.status(401).json({ message: 'Unauthorized user!!' });
  }
};
exports.profile = function (req, res, next) {
  if (req.user) {
    res.send(req.user);
    next();
  }
  else {
    return res.status(401).json({ message: 'Invalid token' });
  }
};