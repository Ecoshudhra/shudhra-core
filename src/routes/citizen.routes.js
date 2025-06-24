const express = require('express');
const controllers = require('../controllers/citizen.controller')
const authMiddleware = require('../middlewares/auth.middleware');
const { validateCitizenRegister,
    validateCitizenLogin,
    validateCitizenOtpVerification,
    validateCitizenSendOtpRequest,
    validateCitizenResetPassword,
    validateCitizenAddress } = require('../middlewares/citizen.middleware');
module.exports = function (io) {
    const router = express.Router()

    // Authentication
    router.post('/auth/register', validateCitizenRegister, controllers.citizenRegister(io));
    router.post('/auth/login', validateCitizenLogin, controllers.citizenLogin(io));
    router.post('/auth/verify-otp', validateCitizenOtpVerification, controllers.citizenValidateWithOTP(io));

    router.post('/auth/send-otp', validateCitizenSendOtpRequest, controllers.sendOtp(io));
    router.patch('/auth/reset-password', validateCitizenResetPassword, authMiddleware(['citizen', 'admin']), controllers.resetPassword(io));

    router.get('/auth/profile', authMiddleware(['citizen']), controllers.citizenProfile(io));
    router.get('/auth/logout', authMiddleware(['citizen']), controllers.citizenLogout(io));

    // non -authenticated routes
    router.put('/address', authMiddleware(['citizen']), validateCitizenAddress, controllers.updateAddress(io))
    return router;
}