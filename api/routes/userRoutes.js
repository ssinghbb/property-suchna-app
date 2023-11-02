'use strict';
module.exports = function (app) {
    var userHandlers = require('../controllers/userController.js');

    app.route('/tasks')
        .post(userHandlers.loginRequired, userHandlers.profile);
    app.route('/sendotp')
        .post(userHandlers.sendOtp);
    app.route('/auth/register')
        .post(userHandlers.register);
    app.route('/auth/sign_in')
        .post(userHandlers.sign_in);
    app.route('/verify')
        .get(userHandlers.verify);
    app.route('/testapi')
        .get(userHandlers.testapi);
};