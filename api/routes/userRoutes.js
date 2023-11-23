'use strict';
module.exports = function (app) {
    var userHandlers = require('../controllers/userController.js');

    app.route('/auth/register')
        .post(userHandlers.register);
    app.route('/auth/sign_in')
        .post(userHandlers.sign_in);
        app.route('/auth/update')
        .put(userHandlers.updateUser);
    app.route('/auth/verify')
        .post(userHandlers.verify);
    app.route('/testapi')
        .get(userHandlers.testapi);
};