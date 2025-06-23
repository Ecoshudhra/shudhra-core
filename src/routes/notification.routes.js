const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { getNotifications, deleteAllNotifications, deleteSingleNotification } = require('../controllers/notification.controller');

const router = express.Router();

router.get('/:type', authMiddleware(['admin', 'municipality', 'citizen']), getNotifications);
router.delete('/:type', authMiddleware(['admin', 'municipality', 'citizen']), deleteAllNotifications);
router.delete('/:type/:id', authMiddleware(['admin', 'municipality', 'citizen']), deleteSingleNotification);

module.exports = router;
