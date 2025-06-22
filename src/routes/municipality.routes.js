const express = require('express');
const controllers = require('../controllers/municipality.controller');
const { validateMunicipalityRequest, validateMunicipalityLogin, validateMunicipalityLoginWithOTP, validateMunicipalityProfileUpdate } = require('../middlewares/municipality.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

module.exports = function (io) {
    const router = express.Router()

    // Authentication
    router.post('/auth/request', validateMunicipalityRequest, controllers.municipalityRequest(io));
    router.post('/auth/login', validateMunicipalityLogin, controllers.municipalityLogin(io));
    router.post('/auth/otp', validateMunicipalityLoginWithOTP, controllers.municipalityValidateWithOTP(io));
    router.get('/auth/profile', authMiddleware(['municipality']), controllers.municipalityProfile(io));
    router.get('/auth/logout', authMiddleware(['municipality']), controllers.municipalityLogout(io));


    router.get('/all', authMiddleware(['admin', 'citizen', 'municipality']), controllers.getAllMunicipalities(io));
    router.post('/:id/approve', authMiddleware(['admin']), controllers.approveMunicipality(io))
    router.post('/:id/reject', authMiddleware(['admin']), controllers.rejectMunicipality(io))
    router.patch('/profile/once/:id', validateMunicipalityProfileUpdate, authMiddleware(['admin', 'municipality']), controllers.updateMunicipalityProfile);

    return router;
}