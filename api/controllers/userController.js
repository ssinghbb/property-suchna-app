'use strict';

var mongoose = require('mongoose'),
  jwt = require('jsonwebtoken'),
  bcrypt = require('bcrypt'),
  User = mongoose.model('User');

// exports.register = function(req, res) {
//   var newUser = new User(req.body);
//   newUser.password = req.body.password;
//   newUser.confirmPassword = req.body.confirmPassword;

//   // Check if password and confirmPassword match
//   if (req.body.password !== req.body.confirmPassword) {
//     return res.status(400).json({ message: "Password and confirm password do not match." });
//   }

//   // Check if the phoneNumber field is included in the request body
//   if (!req.body.phoneNumber) {
//     return res.status(400).json({ message: "Phone number is required." });
//   }

//   User.findOne({ phoneNumber: req.body.phoneNumber })
//     .then(existingUser => {
//       if (existingUser) {
//         return res.status(400).json({ message: "User with this phone number already exists." });
//       }

//       // Hash the password and confirmPassword before saving
//       newUser.password = bcrypt.hashSync(req.body.password, 10);
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
//           return res.json(user);
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

exports.register = function(req, res) {
  console.log(req.body,'req.body');
  var newUser = new User(req.body);
  newUser.password = req.body.password;
  newUser.confirmPassword = req.body.confirmPassword;

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
        return res.status(400).json({ message: "User with this phone number already exists." });
      }

      // Hash the password and confirmPassword before saving
      newUser.hash_password = bcrypt.hashSync(req.body.password, 10);
      newUser.confirmPassword = bcrypt.hashSync(req.body.confirmPassword, 10);

      newUser.save()
        .then(user => {
          if (!user) {
            return res.status(400).send({
              message: "User registration failed. Please try again."
            });
          }
          user.password = undefined;
          user.confirmPassword = undefined;
          // return res.json({user._id});
           return res.json({success:true,message:'User Registered Successfully',data:{
              user
           }}); 

        })
        .catch(err => {
          let errorMessage = "An error occurred while creating the user.";
          return res.status(400).send({
            message: errorMessage
          });
        });
    })
    .catch(err => {
      return res.status(500).send({ message: "Internal Server Error" });
    });
};


exports.sign_in = function(req, res) {
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

exports.loginRequired = function(req, res, next) {
  if (req.user) {
    next();
  } else {

    return res.status(401).json({ message: 'Unauthorized user!!' });
  }
};
exports.profile = function(req, res, next) {
  if (req.user) {
    res.send(req.user);
    next();
  } 
  else {
   return res.status(401).json({ message: 'Invalid token' });
  }
};