"use strict";

const notifcationModel = require("../models/notificationModel");
require("dotenv").config();


//user register

//Verify the user mobile number via OTP

exports.getNotifications = async function (req, res) {
    console.log("getNotifications contorlller:")
    console.log("req:", req?.params?.userId)
    let _data = await notifcationModel.find({ userId: req?.params?.userId })
    console.log("_data:", _data)


    return res.status(200).json({ message: "Server is running...." });
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