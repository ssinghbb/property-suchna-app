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
  reelId: {
    type: ObjectId,
  },
  islikecommentUserId: {
    type: ObjectId,
  },
  comment: {
    type: String,
  },
  fullName: {
    type: String,
  },
  isComment: {
    type: Boolean,  
    default: false,  
  },
  isLike: {
    type: Boolean,  
    default: false,
  },
  type: {
    type: String,
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
