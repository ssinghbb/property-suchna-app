'use strict';

var mongoose = require('mongoose'),
  bcrypt = require('bcrypt'),
  Schema = mongoose.Schema;

/**
 * User Schema
 */
var NotificationSchema = new Schema({
  // fullName: {
  //   type: String,
  //   trim: true,
  //   required: true
  // },
  // url: {
  //   type: String,
  //   trim: true,
  // },
  userId: {
    type: String,
  }
  ,
  postId: {
    type: String,
  },
  comment: {
    type: String
  }
  , text: {
    type: String
  },
  postUserId: {
    type: String
  }
});

// UserSchema.methods.comparePassword = function (password) {
//   return bcrypt.compareSync(password, this.hash_password);
// };

const NotificationsSchemaModel = mongoose.model('Notifications', NotificationSchema);
module.exports = NotificationsSchemaModel;