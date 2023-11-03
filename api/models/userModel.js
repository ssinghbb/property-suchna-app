'use strict';

var mongoose = require('mongoose'),
  bcrypt = require('bcrypt'),
  Schema = mongoose.Schema;

/**
 * User Schema
 */
var UserSchema = new Schema({
  fullName: {
    type: String,
    trim: true,
    required: true
  },
  phoneNumber: {
    type: String,
    unique: true,
    required: true
  },
  hash_password: {
    type: String,
    required: true
  },
  confirmPassword: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.hash_password);
};

const userModel = mongoose.model('User', UserSchema);
module.exports = userModel