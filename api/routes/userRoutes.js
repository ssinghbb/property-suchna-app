"use strict";
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
module.exports = function (app) {
  var userHandlers = require("../controllers/userController.js");

  app.put("/auth/update", upload.single("file"), userHandlers.updateUser);
  app.route("/auth/register").post(userHandlers.register);
  app.route("/auth/sign_in").post(userHandlers.sign_in);
  app.route("/auth/verify").post(userHandlers.verify);
  app.route("/testapi").get(userHandlers.testapi);
};
