"use strict";
var cors = require("cors");
var fileUpload = require("express-fileupload");
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

app.use(
  fileUpload({
    useTempFiles: true,
  })
);
 //app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(function (req, res, next) {
  if (
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    try {

      const isValid= jsonwebtoken.verify(
        req.headers.authorization.split(" ")[1],
        process.env.JWT_SECRET_KEY
      );
    req.user = isValid.data;

    } catch (error) {
      console.log("error",error);
    }
  } else {
    req.user = undefined;
    
  }
  next();
});
app.use(express.static("post"));
var userRoutes = require("./api/routes/userRoutes");
var postRoutes = require("./api/routes/postRoutes");

userRoutes(app);
postRoutes(app);

app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + " not found" });
});

app.listen(port);

console.log("RESTful API server started on: " + port);

module.exports = app;
