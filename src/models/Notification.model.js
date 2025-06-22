const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'receiverType'
  },
  receiverType: {
    type: String,
    enum: ['Admin', 'Municipality', 'Citizen'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  link: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);