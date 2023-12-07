"use strict";

var mongoose = require("mongoose"),
  bcrypt = require("bcrypt"),
  Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema.Types;

/**
 * User Schema
 */
var NotificationSchema = new Schema({
  userId: {
    type: ObjectId,
  },
  postId: {
    type: ObjectId,
  },
  commentUserId: {
    type: ObjectId,
  },
  comment: {
    type: String,
  },

  isComment: {
    type: Boolean,  
    default: true,  
  },
  isLike: {
    type: Boolean,  
    default: false,
  },
  notificationDate: {
    type: Date,
    default: Date.now,
  },
});

const NotificationsSchemaModel = mongoose.model(
  "Notifications",
  NotificationSchema
);
module.exports = NotificationsSchemaModel;