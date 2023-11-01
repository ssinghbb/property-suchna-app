'use strict';

const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const Schema = mongoose.Schema;
var commentSchema = new Schema({
    postId:{
      type:ObjectId,
      required:true,
    },
    userId:{
       type:ObjectId,
       required:true,
    },
    likes:[{
        type:ObjectId,
    }],
    comment:{
        type:String,
        required:true,
     },
    commentDate: {
        type: Date,
        default: Date.now
    }
})
const commentSchemaModel=mongoose.model("comments",commentSchema)
module.exports=commentSchemaModel;