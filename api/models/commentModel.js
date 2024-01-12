"use strict";
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const Schema = mongoose.Schema;


const commentSchema = new Schema({
  comment: {
    type: String,
    required:true,
  },
  userId: {
    type: ObjectId,
    required: true,
  },
  postId: {
    type: ObjectId,
    // required: true,
  },
  reelId: {
    type: ObjectId,
    // required: true,
  },
  likes:[{
        type: ObjectId,
  }],
  commentedDate: {
    type: Date,
    default: Date.now,
  },
});

const commentSchemaModel= mongoose.model("comments",commentSchema)
module.exports=commentSchemaModel;

