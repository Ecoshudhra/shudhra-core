const express = require('express');
const controllers = require('../controllers/garbage.controller')
const authMiddleware = require('../middlewares/auth.middleware');
const { validateGarbageReport, validateGarbageStatusChange } = require('../middlewares/garbage.middleware');

module.exports = function (io) {
    const router = express.Router()

    router.post("/report", validateGarbageReport, authMiddleware(['citizen']), controllers.reportGarbage(io));
    router.patch('/status/:id', validateGarbageStatusChange, authMiddleware(['municipality', 'admin']), controllers.updateGarbageStatus(io));


    return router;

}