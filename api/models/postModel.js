'use strict';

const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const Schema = mongoose.Schema;
var postSchema = new Schema({
    caption:{
        type:String,
        trim: true,
    },
    url:{
        type:String,
        trim: true,
        required:true
    },
    likes:[{
        type:ObjectId,
    }],
    postedBy:{
       type:ObjectId,
       required:true,
    },
    postedDate: {
        type: Date,
        default: Date.now
    },userName: {
        type: String,
        required: true,
      },
      location: {
        type: String,
      },
      description: {
        type: String,
      },
})

const postSchemaModel=mongoose.model("Posts",postSchema)
module.exports=postSchemaModel;