const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const NotificationModel = require('../models/Notification.model');
const router = express.Router();

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const allowedTypes = ['admin', 'municipality', 'citizen'];

// --------- Get Notifications ---------
router.get('/:type', authMiddleware(['admin', 'municipality', 'citizen']), async (req, res) => {
    const { type } = req.params;
    const userId = req.user?._id;

    if (!allowedTypes.includes(type.toLowerCase()) || type.toLowerCase() !== req.user?.role) {
        return res.status(403).json({ message: 'Unauthorized to view these notifications.' });
    }

    try {
        const filter = {
            receiverType: capitalize(type)
        };

        // For citizen or municipality, fetch by receiverId
        if (type !== 'admin') {
            filter.receiverId = userId;
        }

        const notifications = await NotificationModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

// --------- Delete All Notifications ---------
router.delete('/:type', authMiddleware(['admin', 'municipality', 'citizen']), async (req, res) => {
    const { type } = req.params;
    const userId = req.user?._id;

    if (!allowedTypes.includes(type.toLocaleLowerCase()) || type.toLocaleLowerCase() !== req.user?.role) {
        return res.status(403).json({ message: 'Unauthorized to view these notifications.' });
    }

    try {
        const filter = {
            receiverType: capitalize(type)
        };

        if (type !== 'admin') {
            filter.receiverId = userId;
        }

        await NotificationModel.deleteMany(filter);
        res.json({ message: `All ${type} notifications deleted successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete notifications' });
    }
});

// --------- Delete One Notification ---------
router.delete('/:type/:id', authMiddleware(['admin', 'municipality', 'citizen']), async (req, res) => {
    const { type, id } = req.params;
    const userId = req.user?._id;

    if (!allowedTypes.includes(type.toLocaleLowerCase()) || type.toLocaleLowerCase() !== req.user?.role) {
        return res.status(403).json({ message: 'Unauthorized to view these notifications.' });
    }

    try {
        const filter = {
            _id: id,
            receiverType: capitalize(type)
        };

        if (type !== 'admin') {
            filter.receiverId = userId;
        }

        const result = await NotificationModel.deleteOne(filter);

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Notification not found or not authorized' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete notification' });
    }
});

module.exports = router;
