"use strict";
var postController = require("../controllers/postController.js");
const multer = require("multer");
const { verifyToken } = require("../validations/index.js");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
module.exports = function (app) {
  app.post('/post/upload', upload.single('file'), postController.upload)
  app.route("/post/delete/:postId/:userId").delete(postController.postDelete);
  app.route("/post/like").put(postController.likePost);
  app.route("/post/likes/:_id").get(postController.getPostLikes);
  app.route("/post/allpost").get(postController.getAllPost);
  app.route("/post/allreel").get(postController.getAllReels);
  app.route("/post/comment").post(postController.addComment);
  app.route("/post/comments/:postId").get(postController.getComments);
  // app.route("/post/comment/like").put(commentController.likeComments);
  //  app.route("/post/delete/:commentId").delete(commentController.deleteComment);
};
