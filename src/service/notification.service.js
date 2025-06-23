const NotificationModel = require('../models/Notification.model');

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

exports.getNotificationsService = async (type, userId) => {
    const filter = { receiverType: capitalize(type) };

    if (type !== 'admin') {
        filter.receiverId = userId;
    }

    const notifications = await NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);

    return notifications;
};

exports.deleteAllNotificationsService = async (type, userId) => {
    const filter = { receiverType: capitalize(type) };
    if (type !== 'admin') filter.receiverId = userId;

    await NotificationModel.deleteMany(filter);
    return true;
};

exports.deleteSingleNotificationService = async (type, id, userId) => {
    const filter = {
        _id: id,
        receiverType: capitalize(type),
    };

    if (type !== 'admin') filter.receiverId = userId;

    const result = await NotificationModel.deleteOne(filter);
    return result.deletedCount > 0;
};
