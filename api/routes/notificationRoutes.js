'use strict';
module.exports = function (app) {
    var notificationHandler = require('../controllers/notificationController.js');
    app.route('/notification/:userId')
        .get(notificationHandler.getNotifications);
};