const express = require('express');
const controllers = require('../controllers/admin.controller')
const authMiddleware = require('../middlewares/auth.middleware');
const { validateAdminRegister, validateAdminLogin, validateAdminLoginWithOTP } = require('../middlewares/admin.middleware');
const NotificationModel = require('../models/Notification.model');


module.exports = function (io) {
    const router = express.Router()

    // Authentication
    router.post('/auth/register', validateAdminRegister, controllers.adminRegister(io));
    router.post('/auth/login', validateAdminLogin, controllers.adminLogin(io));
    router.post('/auth/otp', validateAdminLoginWithOTP, controllers.adminValidateWithOTP(io));
    router.get('/auth/profile', authMiddleware(['admin']), controllers.adminProfile(io));
    router.get('/auth/logout', authMiddleware(['admin']), controllers.adminLogout(io));
    return router;
}