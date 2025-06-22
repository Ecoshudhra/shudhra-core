const express = require('express');
const controllers = require('../controllers/citizen.controller')
const authMiddleware = require('../middlewares/auth.middleware');
const { validateCitizenLoginWithOTP, validateCitizenLogin, validateCitizenRegister } = require('../middlewares/citizen.middleware');
module.exports = function (io) {
    const router = express.Router()

    // Authentication
    router.post('/auth/register', validateCitizenRegister, controllers.citizenRegister(io));
    router.post('/auth/login', validateCitizenLogin, controllers.citizenLogin(io));
    router.post('/auth/otp', validateCitizenLoginWithOTP, controllers.citizenValidateWithOTP(io));
    router.get('/auth/profile', authMiddleware(['citizen']), controllers.citizenProfile(io));
    router.get('/auth/logout', authMiddleware(['citizen']), controllers.citizenLogout(io));

    return router;

}