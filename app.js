"use strict"; //directive at the beginning of the JavaScript code enables strict mode for the entire script
var cors = require("cors");
require("dotenv").config();

var express = require("express"),
  app = express(),
  port = process.env.PORT || 3000,
  User = require("./api/models/userModel"),
  bodyParser = require("body-parser"),
  jsonwebtoken = require("jsonwebtoken");

const mongoose = require("mongoose");
const option = {
  socketTimeoutMS: 30000,
  keepAlive: true,
  reconnectTries: 30000,
};

const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI).then(
  function () {
    console.log("DB connected successfully");
  },
  function (err) {
    console.log("DB not connected:", err);
  }
);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(function (req, res, next) {
  // console.log(" Bearertoken",req.headers.authorization.split(" ")[0]);
  // console.log(" maintoken",req.headers.authorization.split(" ")[1]);
  if (req.originalUrl === '/auth/register' || req.originalUrl === '/auth/verify' || req.originalUrl === '/auth/sign_in' || req.originalUrl === '/testapi') {
    next(); 
  } 
   else if (
  //  if (
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    try {
      const isValid = jsonwebtoken.verify(
        req.headers.authorization.split(" ")[1],
        process.env.JWT_SECRET_KEY
      );
      req.user = isValid.data;
      next();
      // res.send({result:"verifyed user"})
    } catch (error) {
      console.log("error", error);
      res.status(401).json({
        message: "Invalid token",
        error: error,
    });
    }
  } else {
    req.user = undefined;
    res.status(401).json({
      message: "Unauthorized user",
  });
  }
  // next();
});
var userRoutes = require("./api/routes/userRoutes");
var postRoutes = require("./api/routes/postRoutes");
var commentRoutes = require("./api/routes/commentRoutes");
var notificationRoutes = require("./api/routes/notificationRoutes");

userRoutes(app);
postRoutes(app);
commentRoutes(app);
notificationRoutes(app);


app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + " not found" });
});

app.listen(port);

console.log("RESTful API server started on: " + port);

module.exports = app;
