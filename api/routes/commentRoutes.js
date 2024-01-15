"use strict";
var commentController = require("../controllers/commentController.js");
const multer = require("multer");
const { verifyToken } = require("../validations/index.js");


module.exports = function (app) {
  app.route("/comment/comments").post(commentController.addComment);
  app.route("/comment/comments/:postId").get(commentController.getComments);
  app.route("/comment/reelcomments").post(commentController.addReelComment);
   app.route("/comment/reelcomments/:reelId").get(commentController.getReelComments);
  // app.route("/post/comment/like").put(commentController.likeComments);
  // app.route("/post/delete/:commentId").delete(commentController.deleteComment);
  
};


