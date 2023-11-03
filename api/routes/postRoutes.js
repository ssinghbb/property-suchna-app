"use strict";
var postController = require("../controllers/postController.js");
const multer = require("multer");

const storage=multer.memoryStorage()
const upload=multer({storage:storage})
module.exports = function (app) {
  app.route("/post/upload").post(postController.upload);
  app.route("/post/like").put(postController.likePost);
  // app.route("/post/comment").post(postController.addComment);
  // app.route("/post/comments/:postId").get(postController.getComments);
  // app.route("/post/comment/like").put(postController.likeComments);
  // app.route("/post/delete/:commentId").delete(postController.deleteComment);
};
