"use strict";

const notifcationModel = require("../models/notificationModel");
var postSchemaModel = require("../models/postModel");

require("dotenv").config();


//user register

//Verify the user mobile number via OTP

exports.getNotifications = async function (req, res) {
    console.log("getNotifications contorlller:")
    console.log("req:", req?.params?.userId)
    let _data = await notifcationModel.find({ userId: req?.params?.userId })
    // console.log("_data111:", _data)
    for (const post of _data) {
    console.log("post----:", post)

    console.log("post?.id:", post?.postId)
        const posts = await postSchemaModel.findById(post?.postId)
        console.log("posts:89098", posts)
        // console.log("posts:", posts)
        post.details=posts
        console.log("post:1111", post)
    }

    // console.log("_post:", posts)
    console.log("_data----:", _data)


    return res.status(200).json(_data);
};

exports.addNotification = async function (req, res) {
    const { userId, postId, comment, id } = req?.body
    let obj = {
        userId: userId,
        postId: postId,
        originalUserId: id,
        time: new Date(),
        comment: comment
    }
    let _data = await notifcationModel.create(obj)
    console.log("_data:", _data)
    res.send({})
}