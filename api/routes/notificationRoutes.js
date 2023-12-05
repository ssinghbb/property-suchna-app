'use strict';
module.exports = function (app) {
    var notificationHandler = require('../controllers/notificationController');


    app.route('/notification/:userId')
        .get(notificationHandler.getNotifications);
    app.route('/notification/:Id')
        .post(notificationHandler.addNotification);
};