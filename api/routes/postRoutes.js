'use strict';
var postController = require('../controllers/postController.js');

module.exports = function(app) {
    app.route('/post/upload').post(postController.upload);
    app.route('/post/like').put(postController.likePost);
   
    
};