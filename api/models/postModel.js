"use strict";

const mongoose = require("mongoose");
const userSchemaModel = require("./userModel");
const { ObjectId } = mongoose.Schema.Types;
const Schema = mongoose.Schema;
var postSchema = new Schema({
  caption: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    trim: true,
    //required:true
  },
  likes: [
    {
      type: ObjectId,
    },
  ],
  comment: [
    {
      
      userId: {
        type: ObjectId,
        required: true,
      },
      userName: {
        type: String,
      },
      comment: {
        type: String,
      },
    },
  ],
  user: {
    type: Object,
  },
  type: {
    type: String,
  },
  userId: {
    type: ObjectId,
    required: true,
  },
  postedDate: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
  },
  description: {
    type: String,
  },
});

const postSchemaModel = mongoose.model("Posts", postSchema);
module.exports = postSchemaModel;
