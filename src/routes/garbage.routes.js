const express = require('express');
const controllers = require('../controllers/garbage.controller')
const authMiddleware = require('../middlewares/auth.middleware');
const { validateGarbageReport, validateGarbageStatusChange } = require('../middlewares/garbage.middleware');

module.exports = function (io) {
    const router = express.Router()

    router.post("/report", validateGarbageReport, authMiddleware(['citizen']), controllers.reportGarbage(io)); 

    router.get('/citizen/my-reports', authMiddleware(['citizen']), controllers.getGarbageReportedByCitizen(io)); 
    router.get('/admin/all', authMiddleware(['admin']), controllers.getAllGarbages(io));
    router.get('/municipality/assigned', authMiddleware(['municipality']), controllers.getGarbageAcceptedByMunicipality(io));
    router.get('/:garbageId', authMiddleware(['citizen', 'admin', 'municipality']), controllers.getGarbageDetailsById(io));

    router.patch('/status/:garbageId', validateGarbageStatusChange, authMiddleware(['municipality', 'admin']), controllers.updateGarbageStatus(io));

    return router;

}