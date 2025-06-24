const {
  getNotificationsService,
  deleteAllNotificationsService,
  deleteSingleNotificationService } = require("../service/notification.service");


const allowedTypes = ['admin', 'municipality', 'citizen'];

exports.getNotifications = async (req, res) => {
  const { type } = req.params;
  const userId = req.user?._id;

  if (!allowedTypes.includes(type.toLowerCase()) || type.toLowerCase() !== req.user?.role) {
    return res.status(403).json({ success: false, message: 'Unauthorized to view these notifications.' });
  }

  try {
    const notifications = await getNotificationsService(type, userId);
    res.json({ notifications, success: true, });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  const { type } = req.params;
  const userId = req.user?._id;

  if (!allowedTypes.includes(type.toLowerCase()) || type.toLowerCase() !== req.user?.role) {
    return res.status(403).json({ success: false, message: 'Unauthorized to delete these notifications.' });
  }

  try {
    await deleteAllNotificationsService(type, userId);
    res.json({ message: `All ${type} notifications deleted successfully`, success: true, });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete notifications', success: false });
  }
};

exports.deleteSingleNotification = async (req, res) => {
  const { type, id } = req.params;
  const userId = req.user?._id;

  if (!allowedTypes.includes(type.toLowerCase()) || type.toLowerCase() !== req.user?.role) {
    return res.status(403).json({ success: false, message: 'Unauthorized to delete this notification.' });
  }

  try {
    const deleted = await deleteSingleNotificationService(type, id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found or not authorized' });
    }

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};
