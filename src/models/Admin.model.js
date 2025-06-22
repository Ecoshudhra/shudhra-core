const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true },
  avatar: {
    type: String,
    default: `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 100)}`
  },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
