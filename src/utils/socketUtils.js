const { default: mongoose } = require('mongoose');
const Notification = require('../models/Notification.model');

const sendNotification = async ({ io, receiverId, receiverType, message, redirectType, redirectId }) => {
    // Save to DB
    const notification = await Notification.create({
        receiverId,
        receiverType,
        message,
        redirectType,
        redirectId
    });

    // Emit to the right room
    const room =
        receiverId && mongoose.Types.ObjectId.isValid(receiverId)
            ? `${receiverType.toLowerCase()}-${receiverId}`
            : receiverType.toLowerCase();


    io.to(room).emit('newNotification', {
        _id: notification._id,
        receiverType: notification.receiverType,
        message: notification.message,
        link: { redirectType, redirectId },
        createdAt: notification.createdAt,
    });

    return notification;
};

const alertNewCreated = async ({ io, receiverId, receiverType, creationType, data }) => {
    const room =
        receiverId && mongoose.Types.ObjectId.isValid(receiverId)
            ? `${receiverType.toLowerCase()}-${receiverId}`
            : receiverType.toLowerCase();


    io.to(room).emit(`new${creationType}Create`, data);

    return true;
};

module.exports = {
    sendNotification,
    alertNewCreated
};
