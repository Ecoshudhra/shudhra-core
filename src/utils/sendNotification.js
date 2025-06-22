// utils/sendNotification.js

const { default: mongoose } = require('mongoose');
const Notification = require('../models/Notification.model');

const sendNotification = async ({ io, receiverId, receiverType, message, link = '' }) => {
    // Save to DB
    const notification = await Notification.create({
        receiverId,
        receiverType,
        message,
        link,
    });

    // Emit to the right room
    const room =
        receiverId && mongoose.Types.ObjectId.isValid(receiverId)
            ? `${receiverType.toLowerCase()}-${receiverId}`
            : receiverType.toLowerCase();


    io.to(room).emit('newNotification', {
        _id: notification._id,
        message: notification.message,
        link: notification.link,
        receiverType: notification.receiverType,
        createdAt: notification.createdAt,
    });

    return notification;
};

module.exports = sendNotification;
